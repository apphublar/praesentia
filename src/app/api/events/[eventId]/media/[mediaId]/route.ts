import { NextResponse } from "next/server";
import { canDeleteMedia } from "@/lib/auth/permissions";
import { canManageEventById } from "@/lib/auth/event-access";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime/events";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";
import { deleteR2Object } from "@/lib/storage/r2";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ eventId: string; mediaId: string }> }
) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId, mediaId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatória." }, { status: 401 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  if (!(await canManageEventById(session.user, eventId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = sanitizeText(body.action, 40);

  if (action === "archive") {
    const item = await repositories.media.archive(mediaId, session.user.id);
    await publishRealtimeEvent({ type: "media.updated", eventId, item });
    return NextResponse.json({ item });
  }

  if (action === "hide_from_screen") {
    const item = await repositories.media.setScreenVisibility(mediaId, false, session.user.id);
    await publishRealtimeEvent({ type: "media.updated", eventId, item });
    return NextResponse.json({ item });
  }

  if (action === "show_on_screen") {
    const item = await repositories.media.setScreenVisibility(mediaId, true, session.user.id);
    await publishRealtimeEvent({ type: "media.updated", eventId, item });
    return NextResponse.json({ item });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}

export async function DELETE(request: Request, context: { params: Promise<{ eventId: string; mediaId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId, mediaId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatória." }, { status: 401 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const member = await repositories.members.findMembership(event.id, session.user.id);
  const media = await repositories.media.findById(mediaId);
  if (!media || media.eventId !== eventId) {
    return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
  }

  const isManager = await canManageEventById(session.user, eventId);
  const ownerId = await repositories.events.findOwnerId(eventId);
  if (!isManager && !canDeleteMedia(event, session.user, member ?? undefined, media, new Date(), ownerId)) {
    return NextResponse.json(
      { error: "Você só pode excluir seu conteúdo nas primeiras 24h do evento. Depois disso, fale com o responsável." },
      { status: 403 }
    );
  }

  if (media.r2Key) {
    try {
      await deleteR2Object(media.r2Key);
    } catch (error) {
      console.error("[media-delete-r2]", error);
      return NextResponse.json({ error: "Não foi possível excluir o arquivo do armazenamento." }, { status: 502 });
    }
  }

  await repositories.media.delete(mediaId, session.user.id);
  await publishRealtimeEvent({ type: "screen.changed", eventId });
  return NextResponse.json({ ok: true });
}
