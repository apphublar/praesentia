import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { sanitizeText } from "@/lib/security/sanitize";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));

    const token = sanitizeText(body.token, 40);
    const rsvpId = sanitizeText(body.rsvpId, 80);
    const action = sanitizeText(body.action, 20) || "check_in";

    if (!token || !rsvpId) {
      return NextResponse.json({ error: "Token e ID obrigatórios." }, { status: 400 });
    }

    if (!UUID_RE.test(eventId) || !UUID_RE.test(rsvpId)) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    if ((event.freeCode ?? "").trim() !== token.trim()) {
      return NextResponse.json({ error: "Token inválido." }, { status: 403 });
    }

    const existing = await repositories.guestRsvps.findById(eventId, rsvpId);
    if (!existing) {
      return NextResponse.json({ error: "Convidado não encontrado neste evento." }, { status: 404 });
    }

    const rsvp =
      action === "undo"
        ? await repositories.guestRsvps.undoCheckIn(eventId, rsvpId, "portaria")
        : await repositories.guestRsvps.checkIn(eventId, rsvpId, "portaria");

    return NextResponse.json({ rsvp });
  } catch (err) {
    console.error("[portaria-check-in]", err);
    const message = err instanceof Error ? err.message : "";
    if (message === "RSVP_NOT_FOUND") {
      return NextResponse.json({ error: "Convidado não encontrado neste evento." }, { status: 404 });
    }
    return NextResponse.json({ error: "Não foi possível registrar a entrada. Tente novamente." }, { status: 500 });
  }
}
