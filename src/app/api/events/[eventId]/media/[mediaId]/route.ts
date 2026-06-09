import { NextResponse } from "next/server";
import { canDeleteMedia, canManageEvent } from "@/lib/auth/permissions";
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
  if (!session) return NextResponse.json({ error: "Conta obrigatoria." }, { status: 401 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento nao encontrado." }, { status: 404 });

  const member = await repositories.members.findMembership(event.id, session.user.id);
  if (!canManageEvent(session.user, member ?? undefined)) {
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

  return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
}

export async function DELETE(request: Request, context: { params: Promise<{ eventId: string; mediaId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId, mediaId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatoria." }, { status: 401 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento nao encontrado." }, { status: 404 });

  const member = await repositories.members.findMembership(event.id, session.user.id);
  const media = await repositories.media.findById(mediaId);
  if (!media || media.eventId !== eventId) {
    return NextResponse.json({ error: "Conteudo nao encontrado." }, { status: 404 });
  }

  if (!canDeleteMedia(event, session.user, member ?? undefined, media)) {
    return NextResponse.json(
      { error: "Voce so pode excluir seu conteudo nas primeiras 24h do evento. Depois disso, fale com o responsavel." },
      { status: 403 }
    );
  }

  if (media.r2Key) {
    try {
      await deleteR2Object(media.r2Key);
    } catch (error) {
      console.error("[media-delete-r2]", error);
      return NextResponse.json({ error: "Nao foi possivel excluir o arquivo do armazenamento." }, { status: 502 });
    }
  }

  await repositories.media.delete(mediaId, session.user.id);
  await publishRealtimeEvent({ type: "screen.changed", eventId });
  return NextResponse.json({ ok: true });
}
