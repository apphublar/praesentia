import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    const body = await request.json();
    const guestName = sanitizeText(body.guestName, 120);
    const phone = body.phone ? sanitizeText(body.phone, 20) : undefined;
    const wantsCapsule = Boolean(body.wantsCapsule);

    if (!guestName) {
      return NextResponse.json({ error: "Informe seu nome para confirmar presença." }, { status: 400 });
    }

    const rsvp = await repositories.guestRsvps.create({ eventId, guestName, phone, wantsCapsule });

    return NextResponse.json({ rsvp });
  } catch (err) {
    console.error("[rsvp]", err);
    return NextResponse.json({ error: "Erro ao confirmar presença." }, { status: 500 });
  }
}
