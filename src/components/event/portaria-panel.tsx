"use client";

import { useMemo, useState } from "react";
import type { GuestRsvp } from "@/types/domain";
import {
  guestCheckInLabel,
  guestMatchesSearch,
  guestPartySize,
  sumPartySize
} from "@/lib/guests/rsvp-display";

export function PortariaPanel({
  eventId,
  token,
  initialRsvps
}: {
  eventId: string;
  token: string;
  initialRsvps: GuestRsvp[];
}) {
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const totalPeople = useMemo(() => sumPartySize(rsvps), [rsvps]);
  const checkedInPeople = useMemo(
    () => sumPartySize(rsvps.filter((rsvp) => rsvp.checkedInAt)),
    [rsvps]
  );
  const filtered = useMemo(
    () => rsvps.filter((rsvp) => guestMatchesSearch(rsvp, search)),
    [rsvps, search]
  );

  async function toggleCheckIn(rsvp: GuestRsvp) {
    setLoadingId(rsvp.id);
    setError("");
    const action = rsvp.checkedInAt ? "undo" : "check_in";
    try {
      const res = await fetch(`/api/events/${eventId}/portaria-check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rsvpId: rsvp.id, action })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.rsvp) {
        setRsvps((current) => current.map((item) => (item.id === rsvp.id ? data.rsvp : item)));
      } else {
        setError(typeof data.error === "string" ? data.error : "Não foi possível registrar a entrada. Tente novamente.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoadingId(null);
  }

  function checkInButtonLabel(rsvp: GuestRsvp) {
    const size = guestPartySize(rsvp);
    if (rsvp.checkedInAt) return "Desfazer";
    return size > 1 ? `Dar entrada (${size} pessoas)` : "Dar entrada";
  }

  return (
    <div className="portaria-panel">
      <div className="portaria-stats">
        <div className="portaria-stat">
          <span className="portaria-stat-label">Confirmados</span>
          <strong className="portaria-stat-value">{totalPeople}</strong>
          <span className="portaria-stat-hint">{rsvps.length} convite{rsvps.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="portaria-stat is-success">
          <span className="portaria-stat-label">Já entraram</span>
          <strong className="portaria-stat-value">{checkedInPeople}</strong>
        </div>
        <div className="portaria-stat is-waiting">
          <span className="portaria-stat-label">Aguardando</span>
          <strong className="portaria-stat-value">{Math.max(0, totalPeople - checkedInPeople)}</strong>
        </div>
      </div>

      <label className="portaria-search">
        <span className="portaria-search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pelo nome do convidado ou acompanhante…"
        />
      </label>

      {error ? <p className="portaria-error">{error}</p> : null}

      {filtered.length === 0 ? (
        <div className="portaria-empty">
          <p>{search ? `Nenhum convidado encontrado para "${search}"` : "Nenhum convidado confirmou presença ainda."}</p>
        </div>
      ) : (
        <div className="portaria-guest-list">
          {filtered.map((rsvp) => {
            const partySize = guestPartySize(rsvp);
            return (
              <article
                key={rsvp.id}
                className={`portaria-guest-card${rsvp.checkedInAt ? " is-checked-in" : ""}`}
              >
                <div className="portaria-guest-main">
                  <div className="portaria-guest-name">{rsvp.guestName}</div>
                  {rsvp.companionName ? (
                    <div className="portaria-guest-companion">
                      <span className="portaria-guest-companion-label">Acompanhante</span>
                      <span>{rsvp.companionName}</span>
                    </div>
                  ) : null}
                  {rsvp.checkedInAt ? (
                    <div className="portaria-guest-checked">
                      ✓ Entrada registrada {new Date(rsvp.checkedInAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {partySize > 1 ? ` · ${partySize} pessoas` : ""}
                    </div>
                  ) : partySize > 1 ? (
                    <div className="portaria-guest-party-hint">Entrada conjunta · {partySize} pessoas</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={`btn portaria-checkin-btn${rsvp.checkedInAt ? " secondary" : ""}`}
                  onClick={() => toggleCheckIn(rsvp)}
                  disabled={loadingId === rsvp.id}
                  aria-label={`${checkInButtonLabel(rsvp)} para ${guestCheckInLabel(rsvp)}`}
                >
                  {loadingId === rsvp.id ? "..." : checkInButtonLabel(rsvp)}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
