"use client";

import { useMemo, useState } from "react";
import type { GuestRsvp } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Avatar, Mono, Segmented } from "@/components/app/ui/primitives";
import { guestCompanionNames } from "@/lib/guests/rsvp-display";

const FILTERS = ["Todos", "Confirmados", "Recusados"] as const;
const STATUS_MAP: Record<(typeof FILTERS)[number], GuestRsvp["rsvpStatus"] | null> = {
  Todos: null,
  Confirmados: "confirmed",
  Recusados: "declined"
};

const STATUS_LABEL: Record<GuestRsvp["rsvpStatus"], [string, string]> = {
  confirmed: ["Confirmado", "#7d9a6f"],
  declined: ["Não vai", "var(--faint)"]
};

export function AdminGuestsPanel({ eventId, initialRsvps }: { eventId: string; initialRsvps: GuestRsvp[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todos");
  const rows = useMemo(
    () => initialRsvps.filter((g) => !STATUS_MAP[filter] || g.rsvpStatus === STATUS_MAP[filter]),
    [filter, initialRsvps]
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <Segmented options={FILTERS.map((f) => ({ v: f, l: f }))} value={filter} onChange={setFilter} />
        <div style={{ display: "flex", gap: 9 }}>
          <a className="btn btn-ghost btn-sm" href={`/api/events/${eventId}/guests/export`}>
            <Icon name="download" size={15} />
            Exportar
          </a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.print()}>
            <Icon name="print" size={15} />
            Imprimir lista
          </button>
        </div>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.4fr 1fr 1fr 90px",
            padding: "12px 20px",
            borderBottom: "1px solid var(--line)",
            background: "var(--card-2)"
          }}
        >
          {["Convidado", "Acompanhantes", "Status", "Contato"].map((h) => (
            <span key={h} className="mono" style={{ fontSize: 9.5 }}>
              {h}
            </span>
          ))}
        </div>
        {rows.length === 0 ? (
          <p style={{ padding: "20px", margin: 0, color: "var(--muted)", fontSize: 13 }}>Nenhum convidado neste filtro.</p>
        ) : (
          rows.map((g, i) => {
            const companions = guestCompanionNames(g);
            const [label, color] = STATUS_LABEL[g.rsvpStatus];
            return (
              <div
                key={g.id}
                className="rowhover"
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.4fr 1fr 1fr 90px",
                  padding: "12px 20px",
                  alignItems: "center",
                  borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none"
                }}
              >
                <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                  <Avatar name={g.guestName} size={32} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{g.guestName}</div>
                    {g.guestEmail ? (
                      <div className="mono" style={{ fontSize: 8.5, color: "var(--coral-deep)" }}>
                        {g.guestEmail}
                      </div>
                    ) : null}
                  </div>
                </div>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{companions.length > 0 ? `+${companions.length}` : "—"}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: color }} />
                  {label}
                </span>
                <div style={{ display: "flex", gap: 8, color: "var(--faint)" }}>
                  {g.guestEmail ? <Icon name="msg" size={15} /> : null}
                  <Icon name="more" size={15} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
