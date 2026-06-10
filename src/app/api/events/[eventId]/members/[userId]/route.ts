import { NextResponse } from "next/server";
import { canManageEventById } from "@/lib/auth/event-access";
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
  if (!session) return NextResponse.json({ error: "Conta obrigatória." }, { status: 401 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  if (!(await canManageEventById(session.user, eventId))) {
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
      message: "Convidado bloqueado e conteúdos arquivados."
    });
  }

  if (action === "unblock") {
    const member = await repositories.members.unblockGuest(eventId, userId, session.user.id);
    await publishRealtimeEvent({ type: "screen.changed", eventId });
    return NextResponse.json({
      member,
      message: "Convidado desbloqueado. Conteúdos arquivados podem ser restaurados pelo responsável."
    });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
