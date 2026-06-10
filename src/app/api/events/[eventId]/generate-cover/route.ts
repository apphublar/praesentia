import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { generateCoverImage } from "@/lib/openai/cover-image";
import { isOpenAIConfigured } from "@/lib/openai/client";
import { getAiCoverQuota } from "@/lib/plans/features";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
    }

    const session = await requireSession();
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const mode = sanitizeText(body.mode, 20) || "generate";
    const editHint = sanitizeText(body.editHint, 400);
    const orientation = sanitizeText(body.orientation, 400);
    const includeFields = (body.includeFields ?? {}) as Record<string, boolean>;

    let event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const quota = getAiCoverQuota(event);

    if (mode === "select") {
      const selectedUrl = sanitizeText(body.coverImageUrl, 4000);
      const pending = event.aiCoverPendingUrls ?? [];
      if (!pending.includes(selectedUrl)) {
        return NextResponse.json({ error: "Versão inválida." }, { status: 400 });
      }
      event = await repositories.events.selectAiCoverVersion(eventId, session.user.id, selectedUrl);
      return NextResponse.json({ coverImageUrl: event.coverImageUrl, pendingUrls: [] });
    }

    if (mode === "edit") {
      if (!quota.canEdit) {
        return NextResponse.json({ error: "Limite de ajustes por IA atingido." }, { status: 403 });
      }
      if (!event.coverImageUrl) {
        return NextResponse.json({ error: "Gere uma versão antes de pedir ajustes." }, { status: 400 });
      }
    } else if (!quota.canGenerate) {
      return NextResponse.json({ error: "Limite de gerações por IA atingido." }, { status: 403 });
    }

    let imageUrl: string | null = null;
    try {
      imageUrl = await generateCoverImage(
        event,
        mode === "edit" ? editHint : undefined,
        orientation || undefined,
        {
          title: includeFields.title !== false,
          date: includeFields.date !== false,
          location: includeFields.location !== false,
          hostName: includeFields.hostName !== false,
          theme: includeFields.theme !== false
        }
      );
    } catch (err) {
      console.error("[generate-cover] persist", err);
      return NextResponse.json(
        { error: "Falha ao salvar a imagem gerada. Verifique o armazenamento (R2) ou tente enviar sua própria imagem." },
        { status: 502 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Falha ao gerar imagem com a OpenAI. Tente novamente ou envie sua imagem." }, { status: 500 });
    }

    if (mode === "edit") {
      event = await repositories.events.incrementAiCoverUsage(eventId, session.user.id, "edit");
      event = await repositories.events.setCoverImage(eventId, session.user.id, {
        coverImageUrl: imageUrl,
        coverSource: "ai"
      });
      return NextResponse.json({
        coverImageUrl: imageUrl,
        quota: getAiCoverQuota(event)
      });
    }

    event = await repositories.events.incrementAiCoverUsage(eventId, session.user.id, "generation");

    const isPaidFlow = quota.maxGenerations > 1;
    if (isPaidFlow) {
      const pending = [...(event.aiCoverPendingUrls ?? []), imageUrl].slice(-quota.maxGenerations);
      event = await repositories.events.setAiCoverPendingUrls(eventId, pending);
      if (pending.length === 1) {
        event = await repositories.events.setCoverImage(eventId, session.user.id, {
          coverImageUrl: pending[0],
          coverSource: "ai"
        });
      }
      return NextResponse.json({
        coverImageUrl: event.coverImageUrl,
        pendingUrls: pending,
        quota: getAiCoverQuota(event)
      });
    }

    event = await repositories.events.setCoverImage(eventId, session.user.id, {
      coverImageUrl: imageUrl,
      coverSource: "ai"
    });

    return NextResponse.json({
      coverImageUrl: imageUrl,
      quota: getAiCoverQuota(event)
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[generate-cover]", err);
    return NextResponse.json({ error: "Erro ao gerar imagem" }, { status: 500 });
  }
}
