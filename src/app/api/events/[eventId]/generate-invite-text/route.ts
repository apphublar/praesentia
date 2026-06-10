import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { isOpenAIConfigured } from "@/lib/openai/client";
import { fillInviteLink, generateInviteCopy } from "@/lib/openai/invite-text";
import { getAiTextQuota } from "@/lib/plans/features";
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
    const mode = sanitizeText(body.mode, 20) || "generate";
    const editHint = sanitizeText(body.editHint, 400);

    let event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const quota = getAiTextQuota(event);

    if (mode === "edit") {
      if (!quota.canEdit) {
        return NextResponse.json({ error: "Limite de ajustes de texto atingido." }, { status: 403 });
      }
      if (!event.inviteCopy) {
        return NextResponse.json({ error: "Gere o texto antes de pedir ajustes." }, { status: 400 });
      }
    } else if (!quota.canGenerate) {
      return NextResponse.json({ error: "Limite de geração de texto atingido." }, { status: 403 });
    }

    const inviteCopy = await generateInviteCopy(event, mode === "edit" ? editHint : undefined);
    if (!inviteCopy) {
      return NextResponse.json({ error: "Falha ao gerar texto com a OpenAI." }, { status: 500 });
    }

    event = await repositories.events.setInviteCopy(eventId, session.user.id, inviteCopy);
    event = await repositories.events.incrementAiTextUsage(
      eventId,
      session.user.id,
      mode === "edit" ? "edit" : "generation"
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const eventLink = appUrl ? `${appUrl.replace(/\/$/, "")}/evento/${event.slug}` : `/evento/${event.slug}`;

    return NextResponse.json({
      inviteCopy,
      whatsappPreview: fillInviteLink(inviteCopy.whatsapp, eventLink),
      quota: getAiTextQuota(event)
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[generate-invite-text]", err);
    return NextResponse.json({ error: "Erro ao gerar texto do convite." }, { status: 500 });
  }
}
