import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { canLike } from "@/lib/auth/permissions";
import { repositories } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime/events";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatória." }, { status: 401 });

  const limit = checkRateLimit(`like:${session.user.id}:${eventId}`, 60, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Muitas curtidas em pouco tempo." }, { status: 429 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const member = await repositories.members.findMembership(event.id, session.user.id);
  if (!canLike(event, member ?? undefined)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const mediaId = sanitizeText(body?.mediaId, 80);
  let result: { liked: boolean; likesCount: number };
  try {
    result = await repositories.likes.toggleLike(eventId, mediaId, session.user.id);
  } catch {
    return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
  }
  const likesCount = result.likesCount;
  await publishRealtimeEvent({ type: "like.changed", eventId, mediaId, likesCount });
  return NextResponse.json({ mediaId, likesCount, liked: result.liked });
}
