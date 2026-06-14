import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { PublicAiCoverError } from "@/lib/openai/ai-cover-errors";
import {
  buildCoverRequestSummary,
  generateEventCoverImage
} from "@/lib/openai/ai-cover-image";
import {
  completeAiCoverUsageReservation,
  refundAiCoverUsageReservation,
  reserveAiCoverUsage
} from "@/lib/openai/ai-cover-usage";
import { isOpenAIConfigured } from "@/lib/openai/client";
import { verifyPublicImageUrl } from "@/lib/openai/persist-image";
import { loadAiCoverAccountContext } from "@/lib/plans/ai-cover-account";
import { getAiCoverQuota } from "@/lib/plans/features";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeMultilineText, sanitizeText } from "@/lib/security/sanitize";
import type { Event } from "@/types/domain";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  let artifactId: string | undefined;
  let reservationCompleted = false;
  let charged = false;
  let usageType: "generation" | "edit" = "generation";
  let sessionUserId = "";
  let evt: Event | null = null;

  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
    }

    const session = await requireSession();
    sessionUserId = session.user.id;
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const mode = sanitizeText(body.mode, 20) || "generate";
    const editHint = sanitizeText(body.editHint, 400);
    const orientation = sanitizeText(body.orientation, 1000);
    const photoInstructions = sanitizeMultilineText(body.photoInstructions, 2500);
    const coverFields = (body.coverFields ?? {}) as Record<string, string>;
    const sanitizedCoverFields = {
      eventTitle: sanitizeText(coverFields.eventTitle, 160),
      hostName: sanitizeText(coverFields.hostName, 120),
      theme: sanitizeText(coverFields.theme, 160),
      date: sanitizeText(coverFields.date, 40),
      startsAt: sanitizeText(coverFields.startsAt, 20),
      endsAt: sanitizeText(coverFields.endsAt, 20),
      venueName: sanitizeText(coverFields.venueName, 160),
      venueAddress: sanitizeText(coverFields.venueAddress, 220),
      venueZip: sanitizeText(coverFields.venueZip, 12),
      venueComplement: sanitizeText(coverFields.venueComplement, 120),
      city: sanitizeText(coverFields.city, 120),
      onlineMeetingUrl: sanitizeText(coverFields.onlineMeetingUrl, 400)
    };
    const externalPhotoCompose = false;
    const primaryPhotoDataUrl =
      typeof body.primaryPhotoDataUrl === "string" && body.primaryPhotoDataUrl.startsWith("data:image/")
        ? body.primaryPhotoDataUrl
        : null;
    const promptVersion =
      mode === "edit"
        ? sanitizeText(body.promptVersion, 80) || "cover-image-correction-v1"
        : sanitizeText(body.promptVersion, 80) || "cover-image-v1";

    evt = await repositories.events.findById(eventId);
    if (!evt) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const account = await loadAiCoverAccountContext(session.user.id);
    const quota = getAiCoverQuota(evt, account);
    const existingCoverOk = evt.coverImageUrl ? await verifyPublicImageUrl(evt.coverImageUrl) : false;
    const replacingBrokenCover = Boolean(evt.coverImageUrl) && !existingCoverOk;

    if (mode === "select") {
      const selectedUrl = sanitizeText(body.coverImageUrl, 4000);
      const pending = evt.aiCoverPendingUrls ?? [];
      if (!pending.includes(selectedUrl)) {
        return NextResponse.json({ error: "Versão inválida." }, { status: 400 });
      }
      evt = await repositories.events.selectAiCoverVersion(eventId, session.user.id, selectedUrl);
      return NextResponse.json({ coverImageUrl: evt.coverImageUrl, pendingUrls: [] });
    }

    if (mode === "edit") {
      if (!quota.canEdit) {
        return NextResponse.json({ allowed: false, error: "Limite de ajustes por IA atingido." }, { status: 402 });
      }
      if (!evt.coverImageUrl) {
        return NextResponse.json({ error: "Gere uma versão antes de pedir ajustes." }, { status: 400 });
      }
      usageType = "edit";
    } else if (!quota.canGenerate && !replacingBrokenCover) {
      return NextResponse.json({ allowed: false, error: "Limite de tentativas criativas atingido." }, { status: 402 });
    } else {
      usageType = "generation";
    }

    const requestSummary = buildCoverRequestSummary(evt, {
      orientation: orientation || undefined,
      photoInstructions: photoInstructions || undefined,
      editHint: mode === "edit" ? editHint : undefined,
      coverFields: sanitizedCoverFields
    });

    const reservation = await reserveAiCoverUsage({
      event: evt,
      userId: session.user.id,
      usageType,
      promptVersion,
      requestSummary,
      skipCharge: usageType === "generation" && replacingBrokenCover
    });

    if (!reservation.allowed || !reservation.artifactId) {
      return NextResponse.json(
        { allowed: false, error: reservation.message },
        { status: 402 }
      );
    }

    artifactId = reservation.artifactId;
    charged = Boolean(reservation.charged);

    const generated = await generateEventCoverImage({
      event: evt,
      ownerId: session.user.id,
      artifactId,
      promptVersion,
      mode: mode === "edit" ? "edit" : "generate",
      requestSummary,
      hostPhotoDataUrl: primaryPhotoDataUrl,
      externalPhotoCompose
    });

    await completeAiCoverUsageReservation({
      eventId,
      artifactId,
      imageDataUrl: generated.imageDataUrl,
      prompt: generated.prompt,
      model: generated.model,
      size: generated.size,
      quality: generated.quality,
      artifact: {
        kind: "event_cover_image",
        provider: generated.provider,
        promptVersion,
        mode
      }
    });
    reservationCompleted = true;

    const imageUrl = generated.imageDataUrl;
    const refreshedAccount = await loadAiCoverAccountContext(session.user.id);

    if (mode === "edit") {
      evt = await repositories.events.setCoverImage(eventId, session.user.id, {
        coverImageUrl: imageUrl,
        coverSource: "ai"
      });
      return NextResponse.json({
        allowed: true,
        coverImageUrl: imageUrl,
        artifactId,
        model: generated.model,
        quota: getAiCoverQuota(evt, refreshedAccount)
      });
    }

    const refreshedEvent = await repositories.events.findById(eventId);
    const updatedQuota = getAiCoverQuota(refreshedEvent as Event, refreshedAccount);
    const usesVersionCarousel = Boolean(updatedQuota.showVersionCarousel && updatedQuota.perEventMax && updatedQuota.perEventMax > 1);

    if (usesVersionCarousel) {
      const pending = [...(evt.aiCoverPendingUrls ?? []), imageUrl].slice(-updatedQuota.maxGenerations);
      evt = await repositories.events.setAiCoverPendingUrls(eventId, pending);
      if (pending.length === 1) {
        evt = await repositories.events.setCoverImage(eventId, session.user.id, {
          coverImageUrl: pending[0],
          coverSource: "ai"
        });
      }
      return NextResponse.json({
        allowed: true,
        coverImageUrl: evt.coverImageUrl,
        pendingUrls: pending,
        artifactId,
        model: generated.model,
        quota: getAiCoverQuota(evt, refreshedAccount)
      });
    }

    evt = await repositories.events.setCoverImage(eventId, session.user.id, {
      coverImageUrl: imageUrl,
      coverSource: "ai"
    });

    return NextResponse.json({
      allowed: true,
      coverImageUrl: imageUrl,
      artifactId,
      model: generated.model,
      quota: getAiCoverQuota(evt, refreshedAccount)
    });
  } catch (err) {
    if (artifactId && !reservationCompleted && sessionUserId) {
      const { eventId } = await params;
      await refundAiCoverUsageReservation({
        eventId,
        userId: sessionUserId,
        artifactId,
        usageType,
        charged,
        reason: err instanceof Error ? err.message : "Falha na geração de imagem.",
        event: evt ?? undefined
      });
    }

    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;

    if (err instanceof PublicAiCoverError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const detail = err instanceof Error ? err.message : "";
    if (/ai_cover_artifacts/i.test(detail)) {
      return NextResponse.json(
        { error: "Banco desatualizado: execute a migração 006-ai-cover-artifacts.sql no Supabase." },
        { status: 503 }
      );
    }

    console.error("[generate-cover]", err);
    return NextResponse.json(
      { error: "Não foi possível concluir a imagem agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
