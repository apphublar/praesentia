import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { requireSession } from "@/lib/auth/session";
import { mapAuditLogToPayment } from "@/lib/billing/payment-history";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";

export async function GET() {
  try {
    const session = await requireSession();
    const rows = await safeRepositoryCall(
      () => repositories.audit.listBillingByActorUserId(session.user.id, 50),
      [],
      "audit.listBillingByActorUserId"
    );

    const eventIds = [...new Set(rows.map((row) => row.eventId).filter(Boolean))] as string[];
    const events = await Promise.all(
      eventIds.map(async (eventId) => {
        const event = await safeRepositoryCall(() => repositories.events.findById(eventId), null, "events.findById");
        return event ? ([eventId, event.title] as const) : null;
      })
    );
    const eventTitles = new Map(events.filter(Boolean) as [string, string][]);

    const payments = rows
      .map((row) => mapAuditLogToPayment(row, row.eventId ? eventTitles.get(row.eventId) : null))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return NextResponse.json({ payments });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[billing/history]", err);
    return NextResponse.json({ error: "Erro ao carregar pagamentos." }, { status: 500 });
  }
}
