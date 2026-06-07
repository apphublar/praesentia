import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { canManageEvent } from "@/lib/auth/permissions";
import { repositories } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime/events";
import { assertTrustedOrigin } from "@/lib/security/origin";

export async function PATCH(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatoria." }, { status: 401 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento nao encontrado." }, { status: 404 });

  const member = await repositories.members.findMembership(event.id, session.user.id);
  if (!canManageEvent(session.user, member ?? undefined)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const nextScreen = {
    ...event.screen,
    enabled: typeof body.enabled === "boolean" ? body.enabled : event.screen.enabled,
    paused: typeof body.paused === "boolean" ? body.paused : event.screen.paused,
    showQrCode: typeof body.showQrCode === "boolean" ? body.showQrCode : event.screen.showQrCode,
    showVideos: typeof body.showVideos === "boolean" ? body.showVideos : event.screen.showVideos,
    showMessages: typeof body.showMessages === "boolean" ? body.showMessages : event.screen.showMessages
  };

  const updatedEvent = await repositories.events.updateScreenSettings(eventId, session.user.id, nextScreen);
  await publishRealtimeEvent({ type: "screen.changed", eventId });
  return NextResponse.json({ screen: updatedEvent.screen });
}
