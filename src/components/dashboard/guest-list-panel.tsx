"use client";

import { useMemo, useState } from "react";
import type { GuestRsvp } from "@/types/domain";
import { guestPartySize, sumPartySize } from "@/lib/guests/rsvp-display";

export function GuestListPanel({
  eventId,
  eventSlug,
  eventFreeCode,
  initialRsvps
}: {
  eventId: string;
  eventSlug: string;
  eventFreeCode?: string;
  initialRsvps: GuestRsvp[];
}) {
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copiedPortaria, setCopiedPortaria] = useState(false);

  const portariaLink =
    typeof window !== "undefined" && eventFreeCode
      ? `${window.location.origin}/evento/${eventSlug}/portaria?token=${eventFreeCode}`
      : eventFreeCode
        ? `/evento/${eventSlug}/portaria?token=${eventFreeCode}`
        : "";

  const totalPeople = useMemo(() => sumPartySize(rsvps), [rsvps]);
  const checkedInPeople = useMemo(
    () => sumPartySize(rsvps.filter((item) => item.checkedInAt)),
    [rsvps]
  );

  async function copyPortariaLink() {
    if (!portariaLink) return;
    await navigator.clipboard.writeText(portariaLink);
    setCopiedPortaria(true);
    setTimeout(() => setCopiedPortaria(false), 2500);
  }

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
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.rsvp) {
        setRsvps((current) => current.map((item) => (item.id === rsvp.id ? data.rsvp : item)));
      } else {
        setError(typeof data.error === "string" ? data.error : "Não foi possível registrar a entrada.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <article className="card dashboard-card guest-list-panel">
      <div className="guest-list-header">
        <div>
          <span className="pill">confirmações de presença</span>
          <h2 className="display" style={{ fontSize: 28, margin: "12px 0 4px" }}>
            {totalPeople} pessoa{totalPeople !== 1 ? "s" : ""} confirmada{totalPeople !== 1 ? "s" : ""}
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
            {rsvps.length} convite{rsvps.length !== 1 ? "s" : ""} · {checkedInPeople} já entraram
          </p>
        </div>
        <div className="guest-list-actions">
          <a className="btn secondary" href={`/api/events/${eventId}/guests/export`}>
            Baixar lista (CSV)
          </a>
          <button type="button" className="btn secondary" onClick={() => window.print()}>
            Imprimir lista
          </button>
        </div>
      </div>

      {eventFreeCode ? (
        <section className="checkin-link-card">
          <div className="checkin-link-card-head">
            <div>
              <span className="checkin-link-kicker">Link do check-in</span>
              <h3>Abra na entrada do evento</h3>
              <p>Compartilhe com quem ficará na recepção. Mostra só nomes — sem telefone.</p>
            </div>
            <span className="checkin-link-badge">Portaria</span>
          </div>
          <code className="checkin-link-url">{portariaLink}</code>
          <div className="checkin-link-actions">
            <button type="button" className="btn" onClick={copyPortariaLink}>
              {copiedPortaria ? "✓ Link copiado!" : "Copiar link do check-in"}
            </button>
            <a className="btn secondary" href={portariaLink} target="_blank" rel="noopener noreferrer">
              Abrir check-in
            </a>
          </div>
        </section>
      ) : null}

      {error ? <p className="settings-status is-error">{error}</p> : null}

      {rsvps.length === 0 ? (
        <p style={{ color: "var(--ink-soft)", marginTop: 16 }}>
          Nenhum convidado confirmou presença ainda. Compartilhe o link do evento!
        </p>
      ) : (
        <div className="guest-list-rows guest-print-list">
          {rsvps.map((rsvp) => {
            const partySize = guestPartySize(rsvp);
            return (
              <div key={rsvp.id} className={`guest-list-row${rsvp.checkedInAt ? " is-checked-in" : ""}`}>
                <div>
                  <strong>{rsvp.guestName}</strong>
                  {rsvp.companionName ? (
                    <div className="guest-list-companion">+ {rsvp.companionName}</div>
                  ) : null}
                  <div className="guest-list-meta">
                    Confirmou em {new Date(rsvp.confirmedAt).toLocaleDateString("pt-BR")}
                    {partySize > 1 ? ` · ${partySize} pessoas` : ""}
                    {rsvp.checkedInAt
                      ? ` · Entrada ${new Date(rsvp.checkedInAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                      : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className={rsvp.checkedInAt ? "btn secondary" : "btn"}
                  disabled={loadingId === rsvp.id}
                  onClick={() => toggleCheckIn(rsvp)}
                >
                  {loadingId === rsvp.id
                    ? "..."
                    : rsvp.checkedInAt
                      ? "Desfazer entrada"
                      : partySize > 1
                        ? `Marcar entrada (${partySize})`
                        : "Marcar entrada"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
