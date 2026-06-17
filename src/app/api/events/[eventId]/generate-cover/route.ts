import { after, NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { getCurrentSession, requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { PublicAiCoverError } from "@/lib/openai/ai-cover-errors";
import { buildCoverRequestSummary } from "@/lib/openai/ai-cover-image";
import {
  executeCoverGeneration,
  failCoverGeneration
} from "@/lib/openai/execute-cover-generation";
import {
  refundAiCoverUsageReservation,
  reserveAiCoverUsage,
  type AiCoverUsageType
} from "@/lib/openai/ai-cover-usage";
import { isOpenAIConfigured } from "@/lib/openai/client";
import { verifyPublicImageUrl } from "@/lib/openai/persist-image";
import { loadAiCoverAccountContext } from "@/lib/plans/ai-cover-account";
import { getAiCoverQuota } from "@/lib/plans/features";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeMultilineText, sanitizeText } from "@/lib/security/sanitize";
import {
  isCoverGenerationStale,
  refundStaleCoverReservation,
  resolveActiveCoverGeneration
} from "@/lib/openai/cover-generation-job";
import type { Event } from "@/types/domain";

export const maxDuration = 300;
export const runtime = "nodejs";

function coverStatusPayload(event: Event, account: Awaited<ReturnType<typeof loadAiCoverAccountContext>>) {
  return {
    coverImageUrl: event.coverImageUrl,
    pendingUrls: event.aiCoverPendingUrls ?? [],
    quota: getAiCoverQuota(event, account)
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: "Conta obrigatória." }, { status: 401 });

    const { eventId } = await params;
    let event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    let account = await loadAiCoverAccountContext(session.user.id);
    const artifactIdParam = new URL(request.url).searchParams.get("artifactId");

    let artifact = artifactIdParam ? await repositories.aiCoverArtifacts.findById(artifactIdParam) : null;
    if (!artifact) {
      const resolved = await resolveActiveCoverGeneration(eventId, session.user.id);
      artifact = resolved.artifact;
      if (resolved.event) event = resolved.event;
      account = resolved.account;
    }

    if (artifact && artifact.eventId !== eventId) {
      return NextResponse.json({ error: "Artefato inválido." }, { status: 404 });
    }

    if (artifact?.status === "reserved" && isCoverGenerationStale(artifact)) {
      event = (await refundStaleCoverReservation(eventId, artifact)) ?? event;
      account = await loadAiCoverAccountContext(session.user.id);
      return NextResponse.json({
        status: "failed",
        artifactId: artifact.id,
        error: "A geração anterior expirou. Tente gerar novamente."
      });
    }

    if (!artifact) {
      return NextResponse.json({
        status: "idle",
        ...coverStatusPayload(event, account)
      });
    }

    if (artifact.status === "completed") {
      const refreshed = await repositories.events.findById(eventId);
      return NextResponse.json({
        status: "completed",
        artifactId: artifact.id,
        coverImageUrl: refreshed?.coverImageUrl ?? artifact.imageDataUrl,
        pendingUrls: refreshed?.aiCoverPendingUrls ?? [],
        quota: getAiCoverQuota(refreshed ?? event, account)
      });
    }

    if (artifact.status === "refunded") {
      return NextResponse.json({
        status: "failed",
        artifactId: artifact.id,
        error: "Não foi possível concluir a imagem. Tente novamente."
      });
    }

    return NextResponse.json({
      status: "processing",
      artifactId: artifact.id,
      ...coverStatusPayload(event, account)
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[generate-cover GET]", err);
    return NextResponse.json({ error: "Erro ao consultar geração." }, { status: 500 });
  }
}

type ParsedCoverRequest = {
  eventId: string;
  sessionUserId: string;
  mode: string;
  editHint: string;
  orientation: string;
  photoInstructions: string;
  sanitizedCoverFields: Record<string, string>;
  primaryPhotoDataUrl: string | null;
  promptVersion: string;
  background: boolean;
};

async function parseCoverRequest(
  body: Record<string, unknown>,
  params: Promise<{ eventId: string }>
): Promise<{ error?: NextResponse; data?: ParsedCoverRequest & { evt: Event; selectCoverImageUrl?: string } }> {
  if (!isOpenAIConfigured()) {
    return { error: NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 }) };
  }

  const session = await requireSession();
  const { eventId } = await params;
  const mode = sanitizeText(body.mode, 20) || "generate";
  const coverFields = (body.coverFields ?? {}) as Record<string, string>;

  const evt = await repositories.events.findById(eventId);
  if (!evt) return { error: NextResponse.json({ error: "Evento não encontrado" }, { status: 404 }) };

  if (!(await canManageEventById(session.user, eventId))) {
    return { error: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) };
  }

  return {
    data: {
      eventId,
      sessionUserId: session.user.id,
      mode,
      editHint: sanitizeText(body.editHint, 400),
      orientation: sanitizeText(body.orientation, 1000),
      photoInstructions: sanitizeMultilineText(body.photoInstructions, 2500),
      sanitizedCoverFields: {
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
      },
      primaryPhotoDataUrl:
        typeof body.primaryPhotoDataUrl === "string" && body.primaryPhotoDataUrl.startsWith("data:image/")
          ? body.primaryPhotoDataUrl
          : null,
      promptVersion:
        mode === "edit"
          ? sanitizeText(body.promptVersion, 80) || "cover-image-correction-v1"
          : sanitizeText(body.promptVersion, 80) || "cover-image-v1",
      background: body.background !== false,
      evt,
      selectCoverImageUrl: sanitizeText(body.coverImageUrl, 4000)
    }
  };
}

function scheduleBackgroundCoverGeneration(input: {
  eventId: string;
  userId: string;
  artifactId: string;
  usageType: AiCoverUsageType;
  promptVersion: string;
  mode: "generate" | "edit";
  requestSummary: ReturnType<typeof buildCoverRequestSummary>;
  primaryPhotoDataUrl: string | null;
  charged: boolean;
  event: Event;
}) {
  after(async () => {
    try {
      await executeCoverGeneration({
        eventId: input.eventId,
        userId: input.userId,
        artifactId: input.artifactId,
        usageType: input.usageType,
        promptVersion: input.promptVersion,
        mode: input.mode,
        requestSummary: input.requestSummary,
        hostPhotoDataUrl: input.primaryPhotoDataUrl,
        charged: input.charged,
        event: input.event
      });
    } catch (err) {
      console.error("[generate-cover background]", err);
      await failCoverGeneration({
        eventId: input.eventId,
        userId: input.userId,
        artifactId: input.artifactId,
        usageType: input.usageType,
        charged: input.charged,
        reason: err instanceof Error ? err.message : "Falha na geração de imagem.",
        event: input.event
      });
    }
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  let artifactId: string | undefined;
  let reservationCompleted = false;
  let charged = false;
  let usageType: AiCoverUsageType = "generation";
  let sessionUserId = "";
  let evt: Event | null = null;

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const parsed = await parseCoverRequest(body, params);
    if (parsed.error) return parsed.error;
    const data = parsed.data!;

    sessionUserId = data.sessionUserId;
    evt = data.evt;
    const { eventId } = data;

    if (data.mode === "select") {
      const selectedUrl = data.selectCoverImageUrl ?? "";
      const pending = evt.aiCoverPendingUrls ?? [];
      if (!pending.includes(selectedUrl)) {
        return NextResponse.json({ error: "Versão inválida." }, { status: 400 });
      }
      evt = await repositories.events.selectAiCoverVersion(eventId, sessionUserId, selectedUrl);
      return NextResponse.json({ coverImageUrl: evt.coverImageUrl, pendingUrls: [] });
    }

    const resolved = await resolveActiveCoverGeneration(eventId, sessionUserId);
    evt = resolved.event ?? evt;
    const account = resolved.account;
    const quota = resolved.quota ?? getAiCoverQuota(evt, account);

    if ((data.mode === "generate" || data.mode === "edit") && resolved.artifact) {
      return NextResponse.json(
        {
          allowed: true,
          status: "processing",
          artifactId: resolved.artifact.id,
          quota
        },
        { status: 202 }
      );
    }

    const existingCoverOk = evt.coverImageUrl ? await verifyPublicImageUrl(evt.coverImageUrl) : false;
    const replacingBrokenCover = Boolean(evt.coverImageUrl) && !existingCoverOk;

    if (data.mode === "edit") {
      if (!quota.canEdit) {
        return NextResponse.json({ allowed: false, error: "Limite de ajustes por IA atingido." }, { status: 402 });
      }
      if (!evt.coverImageUrl) {
        return NextResponse.json({ error: "Gere uma versão antes de pedir ajustes." }, { status: 400 });
      }
      usageType = "edit";
    } else if (!quota.canGenerate && !replacingBrokenCover) {
      return NextResponse.json(
        { allowed: false, needsUpgrade: quota.canPurchaseUpgrade, error: "Limite de tentativas criativas atingido." },
        { status: 402 }
      );
    } else {
      usageType = "generation";
    }

    const requestSummary = buildCoverRequestSummary(evt, {
      orientation: data.orientation || undefined,
      photoInstructions: data.photoInstructions || undefined,
      editHint: data.mode === "edit" ? data.editHint : undefined,
      coverFields: data.sanitizedCoverFields
    });

    const reservation = await reserveAiCoverUsage({
      event: evt,
      userId: sessionUserId,
      usageType,
      promptVersion: data.promptVersion,
      requestSummary,
      skipCharge: usageType === "generation" && replacingBrokenCover
    });

    if (!reservation.allowed || !reservation.artifactId) {
      return NextResponse.json(
        { allowed: false, needsUpgrade: quota.canPurchaseUpgrade, error: reservation.message },
        { status: 402 }
      );
    }

    artifactId = reservation.artifactId;
    charged = Boolean(reservation.charged);
    const generationMode = data.mode === "edit" ? "edit" : "generate";

    if (data.background) {
      scheduleBackgroundCoverGeneration({
        eventId,
        userId: sessionUserId,
        artifactId,
        usageType,
        promptVersion: data.promptVersion,
        mode: generationMode,
        requestSummary,
        primaryPhotoDataUrl: data.primaryPhotoDataUrl,
        charged,
        event: evt
      });

      return NextResponse.json(
        {
          allowed: true,
          status: "processing",
          artifactId,
          quota: reservation.quota
        },
        { status: 202 }
      );
    }

    const result = await executeCoverGeneration({
      eventId,
      userId: sessionUserId,
      artifactId,
      usageType,
      promptVersion: data.promptVersion,
      mode: generationMode,
      requestSummary,
      hostPhotoDataUrl: data.primaryPhotoDataUrl,
      charged,
      event: evt
    });
    reservationCompleted = true;

    return NextResponse.json({
      allowed: true,
      status: "completed",
      coverImageUrl: result.coverImageUrl,
      pendingUrls: result.pendingUrls,
      artifactId,
      model: result.model,
      quota: result.quota
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
