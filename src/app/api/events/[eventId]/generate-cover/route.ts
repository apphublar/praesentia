import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireSession } from "@/lib/auth/session";
import { canManageEvent } from "@/lib/auth/permissions";
import { repositories } from "@/lib/db";
import { getAiCoverQuota } from "@/lib/plans/features";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

const EVENT_TYPE_LABELS: Record<string, string> = {
  festa_infantil: "festa infantil",
  casamento: "casamento",
  aniversario: "aniversário",
  formatura: "formatura",
  corporativo: "evento corporativo",
  outros: "evento especial"
};

function buildPrompt(
  event: { title: string; theme: string; eventType: string; hostName: string; date: string; venueName: string; city: string },
  editHint?: string
) {
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? "evento especial";
  const dateFormatted = new Date(event.date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const editLine = editHint ? `\nAdjustment requested: ${editHint}` : "";

  return `Create a beautiful, elegant vertical digital invitation card for a ${typeLabel}.

Event: "${event.title}"
Honoree: ${event.hostName}
Theme: ${event.theme}
Date: ${dateFormatted}
Venue: ${event.venueName}, ${event.city}${editLine}

Design requirements:
- Portrait orientation (vertical format, ideal for WhatsApp and Instagram Stories)
- Style matches the theme: ${event.theme}
- Elegant, modern, festive design appropriate for a ${typeLabel}
- Include decorative elements that match the theme
- Color palette harmonious with the theme
- Brazilian Portuguese aesthetic
- High quality, photorealistic invitation design
- NO text or typography in the image — only decorative visual elements and background design`;
}

async function generateImage(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const openai = new OpenAI({ apiKey });
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1792",
    quality: "standard",
    style: "vivid"
  });

  return response.data?.[0]?.url ?? null;
}

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const mode = sanitizeText(body.mode, 20) || "generate";
    const editHint = sanitizeText(body.editHint, 400);

    let event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    const membership = await repositories.members.findMembership(eventId, session.user.id);
    if (!canManageEvent(session.user, membership ?? undefined)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const quota = getAiCoverQuota(event);

    if (mode === "select") {
      const selectedUrl = sanitizeText(body.coverImageUrl, 2000);
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

    const imageUrl = await generateImage(buildPrompt(event, mode === "edit" ? editHint : undefined));
    if (!imageUrl) {
      return NextResponse.json({ error: "OpenAI não configurado ou falha na geração." }, { status: 500 });
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
    console.error("[generate-cover]", err);
    return NextResponse.json({ error: "Erro ao gerar imagem" }, { status: 500 });
  }
}
