import { formatBrl } from "@/lib/admin/constants";
import { mapAuditLogToPayment } from "@/lib/billing/payment-history";
import { adminRepository } from "@/lib/db";

function statusLabel(status: string) {
  if (status === "paid") return "Pago";
  if (status === "included") return "Incluído";
  if (status === "test") return "Teste";
  if (status === "failed") return "Recusado";
  return status;
}

export default async function AdminBillingPage() {
  const { rows, total } = await adminRepository.listTransactions({ limit: 200 });
  const paidTotal = rows.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.amountBrl, 0);

  return (
    <section className="platform-admin-section">
      <div className="platform-admin-section-head">
        <div>
          <h2>Cobrança e transações</h2>
          <p className="platform-admin-lead">
            {total} registros · faturamento listado: {formatBrl(paidTotal)}
          </p>
        </div>
      </div>

      <div className="platform-admin-table-wrap card">
        <table className="platform-admin-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>Ação</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const mapped = mapAuditLogToPayment({
                id: row.id,
                actorUserId: row.actorUserId,
                eventId: row.eventId,
                action: row.action,
                targetType: "billing",
                targetId: row.eventId,
                metadata: row.metadata,
                createdAt: row.createdAt
              }, row.eventTitle);

              return (
                <tr key={row.id}>
                  <td>{new Date(row.createdAt).toLocaleString("pt-BR")}</td>
                  <td>
                    <strong>{row.actorName ?? "—"}</strong>
                    <small>{row.actorEmail ?? ""}</small>
                  </td>
                  <td>{row.eventTitle ?? "—"}</td>
                  <td>{mapped?.title ?? row.action}</td>
                  <td>{row.amountLabel}</td>
                  <td>
                    <span className={`platform-admin-badge${row.status === "failed" ? " is-danger" : row.status === "test" ? " is-muted" : ""}`}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
