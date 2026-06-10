import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getEffectiveFeatures } from "@/lib/plans/features";
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

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!getEffectiveFeatures(event).checkIn) {
      return NextResponse.json({ error: "Check-in não disponível." }, { status: 403 });
    }

    const rsvp =
      action === "undo"
        ? await repositories.guestRsvps.undoCheckIn(eventId, rsvpId, session.user.id)
        : await repositories.guestRsvps.checkIn(eventId, rsvpId, session.user.id);
    return NextResponse.json({ rsvp });
  } catch (error) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;
    return NextResponse.json({ error: "Convidado não encontrado." }, { status: 404 });
  }
}
