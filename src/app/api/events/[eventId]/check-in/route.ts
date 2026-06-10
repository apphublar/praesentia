import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getEffectiveFeatures } from "@/lib/plans/features";
import { isValidEntityId } from "@/lib/security/ids";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const rsvpId = sanitizeText(body.rsvpId, 80);
    const action = sanitizeText(body.action, 20) || "check_in";

    if (!rsvpId) {
      return NextResponse.json({ error: "ID do convidado obrigatório." }, { status: 400 });
    }

    if (!isValidEntityId(eventId) || !isValidEntityId(rsvpId)) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!getEffectiveFeatures(event).checkIn) {
      return NextResponse.json({ error: "Check-in não disponível." }, { status: 403 });
    }

    const existing = await repositories.guestRsvps.findById(eventId, rsvpId);
    if (!existing) {
      return NextResponse.json({ error: "Convidado não encontrado." }, { status: 404 });
    }

    const rsvp =
      action === "undo"
        ? await repositories.guestRsvps.undoCheckIn(eventId, rsvpId, session.user.id)
        : await repositories.guestRsvps.checkIn(eventId, rsvpId, session.user.id);

    return NextResponse.json({ rsvp });
  } catch (error) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;
    console.error("[check-in]", error);
    const message = error instanceof Error ? error.message : "";
    if (message === "RSVP_NOT_FOUND") {
      return NextResponse.json({ error: "Convidado não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: "Não foi possível registrar a entrada. Tente novamente." }, { status: 500 });
  }
}
