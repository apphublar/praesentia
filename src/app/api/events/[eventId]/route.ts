import { NextResponse } from "next/server";
import { canManageEventById } from "@/lib/auth/event-access";
import { normalizeEventDateString, normalizeEventTimeString } from "@/lib/events/datetime";
import { getCurrentSession, requireRecentAuthentication } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { normalizeGiftSuggestions } from "@/lib/events/gift-suggestions";
import { isValidPixKey, sanitizeText } from "@/lib/security/sanitize";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const media = await repositories.media.listPublishedByEvent(eventId);
  return NextResponse.json({ event, media });
}

export async function PATCH(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatória." }, { status: 401 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  if (!(await canManageEventById(session.user, eventId))) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const hasSensitiveChange = body.visibility === "public" || body.subdomain;

  if (hasSensitiveChange) {
    try {
      requireRecentAuthentication(session);
    } catch {
      return NextResponse.json({ error: "Reautenticação necessária para esta ação." }, { status: 428 });
    }
  }

  if (body.pix) {
    const key = sanitizeText(body.pix.key, 120);
    if (body.pix.enabled && !isValidPixKey(key)) {
      return NextResponse.json({ error: "Chave Pix inválida." }, { status: 400 });
    }
  }

  if (body.visibility === "public" && body.acceptedPublicTerms !== true) {
    return NextResponse.json({ error: "Aceite os termos para tornar o evento público." }, { status: 400 });
  }

  if (body.visibility === "public" || body.visibility === "private") {
    await repositories.events.setVisibility(eventId, body.visibility, session.user.id);
  }

  if (body.pix) {
    await repositories.events.updatePixSettings(eventId, session.user.id, {
      enabled: Boolean(body.pix.enabled),
      receiverName: sanitizeText(body.pix.receiverName, 120),
      key: sanitizeText(body.pix.key, 120),
      suggestedAmount: Number(body.pix.suggestedAmount || 0) || undefined,
      message: sanitizeText(body.pix.message, 180)
    });
  }

  if (body.giftSuggestions !== undefined) {
    const giftSuggestions = normalizeGiftSuggestions(body.giftSuggestions);
    await repositories.events.update(eventId, session.user.id, { giftSuggestions });
  }

  if (body.details && typeof body.details === "object") {
    const d = body.details as Record<string, unknown>;
    await repositories.events.update(eventId, session.user.id, {
      title: sanitizeText(d.title, 160),
      theme: sanitizeText(d.theme, 160),
      hostName: sanitizeText(d.hostName, 120),
      organizerName: d.organizerName ? sanitizeText(d.organizerName, 120) : undefined,
      date: typeof d.date === "string" ? normalizeEventDateString(d.date) : undefined,
      startsAt: typeof d.startsAt === "string" ? normalizeEventTimeString(d.startsAt) : undefined,
      endsAt: typeof d.endsAt === "string" ? normalizeEventTimeString(d.endsAt) : undefined,
      venueName: sanitizeText(d.venueName, 160),
      venueAddress: sanitizeText(d.venueAddress, 220),
      venueZip: d.venueZip ? sanitizeText(d.venueZip, 12) : undefined,
      venueComplement: d.venueComplement ? sanitizeText(d.venueComplement, 120) : undefined,
      city: sanitizeText(d.city, 120),
      onlineMeetingUrl: d.onlineMeetingUrl ? sanitizeText(d.onlineMeetingUrl, 400) : undefined,
      rsvpEnabled: typeof d.rsvpEnabled === "boolean" ? d.rsvpEnabled : undefined,
      rsvpDeadline:
        d.rsvpDeadline === null
          ? null
          : typeof d.rsvpDeadline === "string"
            ? normalizeEventDateString(d.rsvpDeadline)
            : undefined,
      checkInNotes:
        d.checkInNotes === null ? null : d.checkInNotes ? sanitizeText(d.checkInNotes, 2000) : undefined
    });
  }

  return NextResponse.json({ ok: true, message: "Evento atualizado." });
}
