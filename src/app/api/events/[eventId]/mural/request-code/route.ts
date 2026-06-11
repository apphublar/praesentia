import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { getEventEndDate } from "@/lib/events/phase";
import { hasCapsuleAccess } from "@/lib/plans/features";
import { generateAccessCode, hashAccessCode } from "@/lib/mural/access-code";
import { sendMuralAccessCodeEmail } from "@/lib/mural/email";
import { getSchedulePhase } from "@/lib/mural/timeline";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await params;
  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  if (!hasCapsuleAccess(event)) {
    return NextResponse.json({ error: "Mural disponível apenas com a Cápsula ativa." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = sanitizeText(body?.email, 160).toLowerCase();
  if (!email) return NextResponse.json({ error: "Informe o e-mail usado na confirmação de presença." }, { status: 400 });

  const rsvp = await repositories.guestRsvps.findConfirmedByEmail(eventId, email);
  if (!rsvp) {
    return NextResponse.json(
      {
        error:
          "Este e-mail não está cadastrado como convidado confirmado. Confirme sua presença ou solicite acesso ao organizador."
      },
      { status: 403 }
    );
  }

  const now = new Date();
  const schedule = getSchedulePhase(event, now);
  if (schedule === "before") {
    return NextResponse.json({ error: "O código de acesso será liberado quando o evento começar." }, { status: 403 });
  }

  const code = generateAccessCode();
  const eventEnd = getEventEndDate(event);
  const expiresAt =
    schedule === "live"
      ? new Date(Math.min(eventEnd.getTime(), now.getTime() + 1000 * 60 * 60 * 6)).toISOString()
      : new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString();

  await repositories.muralAccess.createCode({
    eventId,
    guestRsvpId: rsvp.id,
    email,
    codeHash: hashAccessCode(code),
    expiresAt
  });

  await sendMuralAccessCodeEmail({
    to: email,
    guestName: rsvp.guestName,
    eventTitle: event.title,
    code,
    isMemory: schedule === "after"
  });

  return NextResponse.json({
    ok: true,
    message: "Enviamos um código de acesso para o seu e-mail."
  });
}
