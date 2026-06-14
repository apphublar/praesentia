"use client";

import Link from "next/link";
import type { PaymentHistoryItem } from "@/lib/billing/payment-history";
import { Icon } from "@/components/app/ui/icon";
import { Mono } from "@/components/app/ui/primitives";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function PaymentHistoryPanel({ initialPayments }: { initialPayments: PaymentHistoryItem[] }) {
  if (initialPayments.length === 0) {
    return (
      <div className="card account-empty-state">
        <Icon name="card" size={28} style={{ color: "var(--coral)", marginBottom: 12 }} />
        <h2 className="serif-i" style={{ fontSize: 22, margin: "0 0 8px" }}>
          Nenhum pagamento ainda
        </h2>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.55, maxWidth: 420 }}>
          Quando você ativar a Cápsula, ampliar armazenamento ou comprar pacotes extras, eles aparecerão aqui como faturas pagas.
        </p>
      </div>
    );
  }

  return (
    <div className="payment-history-list">
      {initialPayments.map((item) => (
        <article key={item.id} className="card payment-history-item">
          <div className="payment-history-item-main">
            <div>
              <Mono style={{ display: "block", marginBottom: 6, fontSize: 9 }}>{formatDate(item.createdAt)}</Mono>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>{item.title}</h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.45 }}>{item.description}</p>
              {item.eventTitle ? (
                <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--ink-2)" }}>
                  Evento:{" "}
                  {item.eventId ? (
                    <Link href={`/dashboard/eventos/${item.eventId}`} style={{ color: "var(--coral-deep)", fontWeight: 600 }}>
                      {item.eventTitle}
                    </Link>
                  ) : (
                    item.eventTitle
                  )}
                </p>
              ) : null}
            </div>
            <div className="payment-history-item-side">
              <span className={`payment-status is-${item.status}`}>{item.status === "paid" ? "Pago" : "Incluído"}</span>
              <strong className="payment-amount">{item.amountLabel}</strong>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
