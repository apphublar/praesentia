import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { hasCapsuleAccess } from "@/lib/plans/features";
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
  const guestFirstName = sanitizeText(body?.guestFirstName, 80);
  const guestLastName = sanitizeText(body?.guestLastName, 80);
  const guestEmail = sanitizeText(body?.guestEmail, 160).toLowerCase();
  const phone = body?.phone ? sanitizeText(body.phone, 20) : undefined;

  if (!guestFirstName || !guestLastName || !guestEmail || !phone) {
    return NextResponse.json({ error: "Informe nome completo, e-mail e WhatsApp." }, { status: 400 });
  }

  const existing = await repositories.guestRsvps.findConfirmedByEmail(eventId, guestEmail);
  if (existing) {
    return NextResponse.json(
      { error: "Este e-mail já confirmou presença. Use a opção de receber código de acesso." },
      { status: 400 }
    );
  }

  const requestRow = await repositories.muralAccess.createAccessRequest({
    eventId,
    guestFirstName,
    guestLastName,
    guestEmail,
    phone
  });

  return NextResponse.json({ request: requestRow }, { status: 201 });
}
