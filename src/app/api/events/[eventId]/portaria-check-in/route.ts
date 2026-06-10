import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { isValidEntityId } from "@/lib/security/ids";
import { sanitizeText } from "@/lib/security/sanitize";

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

    if (!isValidEntityId(eventId) || !isValidEntityId(rsvpId)) {
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

    if (action === "update_companions") {
      if (existing.checkedInAt) {
        return NextResponse.json({ error: "Não é possível alterar acompanhantes após a entrada." }, { status: 400 });
      }
      const rawNames = Array.isArray(body.companionNames) ? body.companionNames : [];
      const companionNames = rawNames
        .map((name: unknown) => sanitizeText(String(name ?? ""), 120))
        .filter(Boolean);
      const rsvp = await repositories.guestRsvps.updateCompanions(eventId, rsvpId, companionNames);
      return NextResponse.json({ rsvp });
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
    if (message === "ALREADY_CHECKED_IN") {
      return NextResponse.json({ error: "Entrada já registrada." }, { status: 400 });
    }
    if (/relation "guest_rsvps" does not exist/i.test(message)) {
      return NextResponse.json(
        { error: "Banco desatualizado. Execute a migração 001-plan-flow.sql no Supabase." },
        { status: 503 }
      );
    }
    if (/companion_names|companion_name/i.test(message) && /column.*does not exist/i.test(message)) {
      return NextResponse.json(
        { error: "Banco desatualizado. Execute as migrações 007 e 008 no Supabase." },
        { status: 503 }
      );
    }
    if (/checked_in_at/i.test(message) && /column.*does not exist/i.test(message)) {
      return NextResponse.json(
        { error: "Banco desatualizado. Execute a migração 001-plan-flow.sql no Supabase." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Não foi possível registrar a entrada. Tente novamente." }, { status: 500 });
  }
}
