import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));

    const token = sanitizeText(body.token, 20);
    const rsvpId = sanitizeText(body.rsvpId, 80);
    const action = sanitizeText(body.action, 20) || "check_in";

    if (!token || !rsvpId) {
      return NextResponse.json({ error: "Token e ID obrigatórios." }, { status: 400 });
    }

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    // Validate access via freeCode (the portaria token)
    if (event.freeCode !== token) {
      return NextResponse.json({ error: "Token inválido." }, { status: 403 });
    }

    const rsvp =
      action === "undo"
        ? await repositories.guestRsvps.undoCheckIn(eventId, rsvpId, "portaria")
        : await repositories.guestRsvps.checkIn(eventId, rsvpId, "portaria");

    return NextResponse.json({ rsvp });
  } catch (err) {
    console.error("[portaria-check-in]", err);
    return NextResponse.json({ error: "Convidado não encontrado." }, { status: 404 });
  }
}
