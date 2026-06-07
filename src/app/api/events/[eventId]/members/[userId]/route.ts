import { NextResponse } from "next/server";
import { canManageEvent } from "@/lib/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime/events";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ eventId: string; userId: string }> }
) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId, userId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatoria." }, { status: 401 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento nao encontrado." }, { status: 404 });

  const actorMembership = await repositories.members.findMembership(event.id, session.user.id);
  if (!canManageEvent(session.user, actorMembership ?? undefined)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = sanitizeText(body.action, 40);

  if (action === "block") {
    const member = await repositories.members.blockGuest(eventId, userId, session.user.id);
    await publishRealtimeEvent({ type: "screen.changed", eventId });
    return NextResponse.json({
      member,
      archivedContent: true,
      message: "Convidado bloqueado e conteudos arquivados."
    });
  }

  if (action === "unblock") {
    const member = await repositories.members.unblockGuest(eventId, userId, session.user.id);
    await publishRealtimeEvent({ type: "screen.changed", eventId });
    return NextResponse.json({
      member,
      message: "Convidado desbloqueado. Conteudos arquivados podem ser restaurados pelo responsavel."
    });
  }

  return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
}
