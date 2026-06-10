"use client";

import { useState } from "react";
import type { GuestRsvp } from "@/types/domain";

export function GuestListPanel({ eventId, initialRsvps }: { eventId: string; initialRsvps: GuestRsvp[] }) {
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleCheckIn(rsvp: GuestRsvp) {
    setLoadingId(rsvp.id);
    setError("");
    const action = rsvp.checkedInAt ? "undo" : "check_in";
    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvpId: rsvp.id, action })
      });
      const data = await res.json();
      if (res.ok) {
        setRsvps((current) => current.map((item) => (item.id === rsvp.id ? data.rsvp : item)));
      } else {
        setError(data.error ?? "Não foi possível atualizar o check-in.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoadingId(null);
    }
  }

  const checkedInCount = rsvps.filter((item) => item.checkedInAt).length;

  return (
    <article className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span className="pill">confirmações de presença</span>
          <h2 className="display" style={{ fontSize: 28, margin: "12px 0 4px" }}>
            {rsvps.length} confirmado{rsvps.length !== 1 ? "s" : ""}
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
            {checkedInCount} já entraram · use na portaria ou entrada do evento
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="btn secondary" href={`/api/events/${eventId}/guests/export`}>
            Baixar lista (CSV)
          </a>
          <button type="button" className="btn secondary" onClick={() => window.print()}>
            Imprimir lista
          </button>
        </div>
      </div>

      {error ? <p className="settings-status is-error">{error}</p> : null}

      {rsvps.length === 0 ? (
        <p style={{ color: "var(--ink-soft)", marginTop: 16 }}>Nenhum convidado confirmou presença ainda. Compartilhe o link do evento!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }} className="guest-print-list">
          {rsvps.map((rsvp) => (
            <div
              key={rsvp.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--line)",
                gap: 12,
                flexWrap: "wrap"
              }}
            >
              <div>
                <strong>{rsvp.guestName}</strong>
                {rsvp.phone && <span style={{ color: "var(--ink-soft)", fontSize: 13, marginLeft: 10 }}>{rsvp.phone}</span>}
                <div style={{ color: "var(--ink-soft)", fontSize: 12, marginTop: 4 }}>
                  Confirmou em {new Date(rsvp.confirmedAt).toLocaleDateString("pt-BR")}
                  {rsvp.checkedInAt && ` · Entrou em ${new Date(rsvp.checkedInAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                </div>
              </div>
              <button
                type="button"
                className={rsvp.checkedInAt ? "btn secondary" : "btn"}
                disabled={loadingId === rsvp.id}
                onClick={() => toggleCheckIn(rsvp)}
              >
                {loadingId === rsvp.id ? "..." : rsvp.checkedInAt ? "Desfazer entrada" : "Marcar entrada"}
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
