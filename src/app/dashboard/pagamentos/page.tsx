import Link from "next/link";
import { PaymentHistoryPanel } from "@/components/app/account/payment-history-panel";
import { requirePageSession } from "@/lib/auth/session";
import { mapAuditLogToPayment } from "@/lib/billing/payment-history";
import { getCachedEventsByIds } from "@/lib/db/cached-queries";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";

export default async function PaymentsPage() {
  const session = await requirePageSession("/dashboard/pagamentos");
  const rows = await safeRepositoryCall(
    () => repositories.audit.listBillingByActorUserId(session.user.id, 50),
    [],
    "audit.listBillingByActorUserId"
  );

  const eventIds = [...new Set(rows.map((row) => row.eventId).filter(Boolean))] as string[];
  const events = await getCachedEventsByIds(eventIds);
  const eventTitles = new Map(events.map((event) => [event.id, event.title]));

  const payments = rows
    .map((row) => mapAuditLogToPayment(row, row.eventId ? eventTitles.get(row.eventId) : null))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="account-page">
      <header className="account-page-header">
        <div>
          <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 36px)", margin: "0 0 8px" }}>
            Pagamentos e faturas
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.55, maxWidth: 560 }}>
            Histórico de cápsulas, ampliações de armazenamento e outros pagamentos feitos na sua conta.
          </p>
        </div>
        <Link className="btn btn-ghost btn-sm" href="/dashboard">
          Voltar aos eventos
        </Link>
      </header>
      <PaymentHistoryPanel initialPayments={payments} />
    </div>
  );
}
