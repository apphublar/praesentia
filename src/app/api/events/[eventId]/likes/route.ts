import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { canLike } from "@/lib/auth/permissions";
import { repositories } from "@/lib/db";
import { isEventInteractionLocked } from "@/lib/mural/timeline";
import { getMuralSession } from "@/lib/mural/session";
import { publishRealtimeEvent } from "@/lib/realtime/events";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await context.params;
  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  if (isEventInteractionLocked(event)) {
    return NextResponse.json({ error: "O período interativo do evento já terminou." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const mediaId = sanitizeText(body?.mediaId, 80);

  const muralSession = await getMuralSession(eventId);
  if (muralSession) {
    const limit = checkRateLimit(`like:guest:${muralSession.guestRsvpId}:${eventId}`, 60, 60_000);
    if (!limit.ok) return NextResponse.json({ error: "Muitas curtidas em pouco tempo." }, { status: 429 });
    try {
      const result = await repositories.likes.toggleGuestLike(eventId, mediaId, muralSession.guestRsvpId);
      await publishRealtimeEvent({ type: "like.changed", eventId, mediaId, likesCount: result.likesCount });
      return NextResponse.json({ mediaId, likesCount: result.likesCount, liked: result.liked });
    } catch {
      return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
    }
  }

  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Faça login no mural para curtir." }, { status: 401 });

  const limit = checkRateLimit(`like:${session.user.id}:${eventId}`, 60, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Muitas curtidas em pouco tempo." }, { status: 429 });

  const member = await repositories.members.findMembership(event.id, session.user.id);
  if (!canLike(event, member ?? undefined)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  try {
    const result = await repositories.likes.toggleLike(eventId, mediaId, session.user.id);
    await publishRealtimeEvent({ type: "like.changed", eventId, mediaId, likesCount: result.likesCount });
    return NextResponse.json({ mediaId, likesCount: result.likesCount, liked: result.liked });
  } catch {
    return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
  }
}
