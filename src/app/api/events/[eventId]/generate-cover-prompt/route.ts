import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { buildCoverRequestSummary } from "@/lib/openai/ai-cover-image";
import { generateCoverPromptAssistDetailed } from "@/lib/openai/cover-prompt-assist";
import { isOpenAIConfigured } from "@/lib/openai/client";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export const maxDuration = 60;
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
    const draftOrientation = sanitizeText(body.draftOrientation, 1000);
    const draftPhotoInstructions = sanitizeText(body.draftPhotoInstructions, 400);
    const withHostPhoto = Boolean(body.withHostPhoto);
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

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const hasDraft =
      draftOrientation.trim().length >= 8 ||
      (withHostPhoto && draftPhotoInstructions.trim().length >= 8) ||
      sanitizedCoverFields.theme.length >= 3;

    if (!hasDraft) {
      return NextResponse.json(
        {
          error:
            "Escreva uma ideia inicial na orientação visual ou nas instruções da foto (ou preencha o tema) antes de pedir ajuda."
        },
        { status: 400 }
      );
    }

    const requestSummary = buildCoverRequestSummary(event, { coverFields: sanitizedCoverFields });

    const assist = await generateCoverPromptAssistDetailed({
      summary: requestSummary,
      draftOrientation,
      draftPhotoInstructions,
      withHostPhoto
    });

    if (!assist.ok) {
      const messageByReason: Record<typeof assist.failure.reason, string> = {
        openai_not_configured: "OPENAI_API_KEY não configurada.",
        empty_response: "A IA não retornou conteúdo. Tente novamente.",
        parse_failed: "A IA retornou um formato inesperado. Tente novamente.",
        openai_error: "Falha ao consultar a OpenAI. Tente novamente em instantes."
      };
      console.error("[generate-cover-prompt]", assist.failure.reason, assist.failure.detail ?? "");
      return NextResponse.json({ error: messageByReason[assist.failure.reason] }, { status: 500 });
    }

    return NextResponse.json({
      visualDirection: assist.result.visualDirection,
      photoInstructions: assist.result.photoInstructions
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[generate-cover-prompt]", err);
    return NextResponse.json({ error: "Erro ao gerar prompt com IA." }, { status: 500 });
  }
}
