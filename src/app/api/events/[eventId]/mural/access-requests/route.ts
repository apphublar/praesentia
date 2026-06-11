import { NextResponse } from "next/server";
import { canManageEventById } from "@/lib/auth/event-access";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { generateAccessCode, hashAccessCode } from "@/lib/mural/access-code";
import { sendMuralAccessCodeEmail } from "@/lib/mural/email";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { eventId } = await params;
  if (!(await canManageEventById(session.user, eventId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const requests = await repositories.muralAccess.listAccessRequests(eventId);
  return NextResponse.json({ requests });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { eventId } = await params;
  if (!(await canManageEventById(session.user, eventId))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const requestId = sanitizeText(body?.requestId, 80);
  const status = body?.status === "denied" ? "denied" : "approved";
  if (!requestId) return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });

  const updated = await repositories.muralAccess.updateAccessRequestStatus(eventId, requestId, status);

  if (status === "approved") {
    const code = generateAccessCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const guestName = `${updated.guestFirstName} ${updated.guestLastName}`.trim();

    let guestRsvp = await repositories.guestRsvps.findConfirmedByEmail(eventId, updated.guestEmail);
    if (!guestRsvp) {
      guestRsvp = await repositories.guestRsvps.create({
        eventId,
        guestName,
        guestFirstName: updated.guestFirstName,
        guestLastName: updated.guestLastName,
        guestEmail: updated.guestEmail,
        phone: updated.phone,
        rsvpStatus: "confirmed",
        termsAcceptedAt: new Date().toISOString(),
        wantsCapsule: true
      });
    }

    await repositories.muralAccess.createCode({
      eventId,
      guestRsvpId: guestRsvp.id,
      email: updated.guestEmail,
      codeHash: hashAccessCode(code),
      expiresAt
    });

    await sendMuralAccessCodeEmail({
      to: updated.guestEmail,
      guestName,
      eventTitle: event.title,
      code
    });
  }

  return NextResponse.json({ request: updated });
}
