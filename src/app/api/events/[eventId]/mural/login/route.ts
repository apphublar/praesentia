import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { getEventEndDate, getEventStartDate } from "@/lib/events/phase";
import { hasCapsuleAccess } from "@/lib/plans/features";
import { verifyAccessCode } from "@/lib/mural/access-code";
import { createMuralSessionToken, muralSessionCookieOptions, MURAL_SESSION_COOKIE } from "@/lib/mural/session-cookie";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await params;
  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  if (!hasCapsuleAccess(event)) {
    return NextResponse.json({ error: "Mural indisponível." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = sanitizeText(body?.email, 160).toLowerCase();
  const code = sanitizeText(body?.code, 12);
  if (!email || !code) {
    return NextResponse.json({ error: "Informe e-mail e código de acesso." }, { status: 400 });
  }

  const now = new Date();
  if (now < getEventStartDate(event)) {
    return NextResponse.json({ error: "O mural abre quando o evento começar." }, { status: 403 });
  }
  if (now > getEventEndDate(event)) {
    return NextResponse.json({ error: "O período interativo do evento já terminou." }, { status: 403 });
  }

  const rsvp = await repositories.guestRsvps.findConfirmedByEmail(eventId, email);
  if (!rsvp) {
    return NextResponse.json(
      { error: "Este e-mail não está cadastrado como convidado confirmado." },
      { status: 403 }
    );
  }

  const stored = await repositories.muralAccess.findLatestCode(eventId, email);
  if (!stored || stored.guestRsvpId !== rsvp.id) {
    return NextResponse.json({ error: "Solicite um novo código de acesso." }, { status: 403 });
  }
  if (new Date(stored.expiresAt) < now) {
    return NextResponse.json({ error: "Código expirado. Solicite um novo código." }, { status: 403 });
  }
  if (!verifyAccessCode(code, stored.codeHash)) {
    return NextResponse.json({ error: "Código inválido." }, { status: 403 });
  }

  const token = createMuralSessionToken({
    eventId,
    guestRsvpId: rsvp.id,
    email,
    guestName: rsvp.guestName
  });

  const cookieStore = await cookies();
  cookieStore.set(MURAL_SESSION_COOKIE, token, muralSessionCookieOptions);

  return NextResponse.json({
    ok: true,
    guestName: rsvp.guestName
  });
}
