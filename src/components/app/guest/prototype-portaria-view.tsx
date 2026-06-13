"use client";

import { useMemo, useState } from "react";
import type { Event, GuestRsvp } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Avatar, Mono } from "@/components/app/ui/primitives";
import {
  guestCheckInLabel,
  guestCompanionNames,
  guestMatchesSearch,
  guestPartySize,
  sumPartySize
} from "@/lib/guests/rsvp-display";

export function PrototypePortariaView({
  event,
  token,
  initialRsvps,
  subtitle
}: {
  event: Event;
  token: string;
  initialRsvps: GuestRsvp[];
  subtitle: string;
}) {
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const confirmed = useMemo(() => rsvps.filter((g) => g.rsvpStatus === "confirmed"), [rsvps]);
  const totalPeople = useMemo(() => sumPartySize(confirmed), [confirmed]);
  const arrived = useMemo(() => sumPartySize(confirmed.filter((g) => g.checkedInAt)), [confirmed]);
  const filtered = useMemo(() => confirmed.filter((rsvp) => guestMatchesSearch(rsvp, search)), [confirmed, search]);

  async function postPortariaAction(rsvpId: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/events/${event.id}/portaria-check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, rsvpId, ...payload })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível concluir a ação.");
    return data.rsvp as GuestRsvp;
  }

  async function toggleCheckIn(rsvp: GuestRsvp) {
    setLoadingId(rsvp.id);
    setError("");
    try {
      const updated = await postPortariaAction(rsvp.id, { action: rsvp.checkedInAt ? "undo" : "check_in" });
      setRsvps((current) => current.map((item) => (item.id === rsvp.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", padding: "24px 20px 40px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <Mono style={{ color: "var(--coral-deep)" }}>Check-in · portaria</Mono>
          <h1 className="serif-i" style={{ fontSize: 30, margin: "8px 0 4px" }}>
            {event.title}
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13.5 }}>{subtitle}</p>
          {event.checkInNotes ? (
            <div className="card" style={{ padding: 16, marginTop: 16 }}>
              <Mono style={{ display: "block", marginBottom: 6 }}>Orientações</Mono>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>{event.checkInNotes}</p>
            </div>
          ) : null}
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          <Stat n={totalPeople} l="esperados" />
          <Stat n={arrived} l="chegaram" accent="var(--coral-deep)" />
          <Stat n={Math.max(0, totalPeople - arrived)} l="aguardando" />
        </div>

        <div className="card-flat" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", background: "#fff", marginBottom: 16 }}>
          <Icon name="search" size={15} style={{ color: "var(--muted)" }} />
          <input
            placeholder="Buscar nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 13, width: "100%" }}
          />
        </div>

        {error ? <p style={{ color: "var(--coral-deep)", fontSize: 13 }}>{error}</p> : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((g) => {
            const on = Boolean(g.checkedInAt);
            const party = guestPartySize(g);
            return (
              <div key={g.id} className="card-flat" style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 16px", background: on ? "var(--card-2)" : "#fff" }}>
                <Avatar name={g.guestName} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{guestCheckInLabel(g)}</div>
                  {guestCompanionNames(g).map((name) => (
                    <div key={name} className="mono" style={{ fontSize: 9 }}>
                      + {name}
                    </div>
                  ))}
                  <div className="mono" style={{ fontSize: 9 }}>{party > 1 ? `${party} pessoas` : "1 pessoa"}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={loadingId === g.id}
                  onClick={() => toggleCheckIn(g)}
                  style={{
                    background: on ? "#7d9a6f" : "var(--card-2)",
                    color: on ? "#fff" : "var(--ink-2)",
                    border: on ? "none" : "1.5px solid var(--line-2)"
                  }}
                >
                  {loadingId === g.id ? "…" : on ? "Na festa" : "Marcar chegada"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l, accent }: { n: number; l: string; accent?: string }) {
  return (
    <div className="card" style={{ padding: "16px 14px", textAlign: "center" }}>
      <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: accent || "var(--ink)" }}>
        {n}
      </div>
      <div className="mono" style={{ fontSize: 9 }}>
        {l}
      </div>
    </div>
  );
}
