import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getEffectiveFeatures } from "@/lib/plans/features";
import { guestCompanionNames, guestPartySize } from "@/lib/guests/rsvp-display";

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await requireSession();
    const { eventId } = await params;

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!getEffectiveFeatures(event).guestListPrint) {
      return NextResponse.json({ error: "Exportação não disponível." }, { status: 403 });
    }

    const guestRsvps = await repositories.guestRsvps.listByEvent(eventId);
    const header = ["Nome", "Acompanhante", "Telefone", "Pessoas", "Confirmado em", "Check-in", "Quer cápsula"];
    const rows = guestRsvps.map((rsvp) => [
      rsvp.guestName,
      guestCompanionNames(rsvp).join("; "),
      rsvp.phone ?? "",
      String(guestPartySize(rsvp)),
      new Date(rsvp.confirmedAt).toLocaleString("pt-BR"),
      rsvp.checkedInAt ? new Date(rsvp.checkedInAt).toLocaleString("pt-BR") : "",
      rsvp.wantsCapsule ? "Sim" : "Não"
    ]);

    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="convidados-${event.slug}.csv"`
      }
    });
  } catch (error) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;
    return NextResponse.json({ error: "Erro ao exportar convidados." }, { status: 500 });
  }
}
