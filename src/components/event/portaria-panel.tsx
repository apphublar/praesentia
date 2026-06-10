"use client";

import { useState } from "react";
import type { GuestRsvp } from "@/types/domain";

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

  const checkedInCount = rsvps.filter((r) => r.checkedInAt).length;
  const filtered = search.trim()
    ? rsvps.filter((r) => r.guestName.toLowerCase().includes(search.toLowerCase().trim()))
    : rsvps;

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
      const data = await res.json();
      if (res.ok) {
        setRsvps((current) => current.map((item) => (item.id === rsvp.id ? data.rsvp : item)));
      } else {
        setError(data.error ?? "Não foi possível atualizar o check-in.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoadingId(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 20px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.05em" }}>Confirmados</div>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 40, lineHeight: 1 }}>{rsvps.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.05em" }}>Já entraram</div>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 40, lineHeight: 1, color: "var(--green)" }}>{checkedInCount}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", letterSpacing: "0.05em" }}>Aguardando</div>
          <div style={{ fontFamily: "DM Serif Display, serif", fontSize: 40, lineHeight: 1, color: "var(--gold)" }}>{rsvps.length - checkedInCount}</div>
        </div>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar convidado pelo nome…"
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid var(--line)",
          background: "var(--card)",
          fontSize: 16,
          fontFamily: "inherit"
        }}
      />

      {error ? (
        <p style={{ color: "var(--coral)", background: "rgba(255,107,92,.08)", padding: "10px 14px", borderRadius: 10, margin: 0 }}>{error}</p>
      ) : null}

      {filtered.length === 0 ? (
        <p style={{ color: "var(--ink-soft)", textAlign: "center", padding: "24px 0" }}>
          {search ? `Nenhum convidado encontrado para "${search}"` : "Nenhum convidado confirmou presença ainda."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((rsvp) => (
            <div
              key={rsvp.id}
              style={{
                background: rsvp.checkedInAt ? "rgba(111,191,115,.10)" : "var(--card)",
                border: `1px solid ${rsvp.checkedInAt ? "rgba(111,191,115,.4)" : "var(--line)"}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12
              }}
            >
              <div>
                <strong style={{ fontSize: 16 }}>{rsvp.guestName}</strong>
                {rsvp.phone && (
                  <div style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 2 }}>{rsvp.phone}</div>
                )}
                {rsvp.checkedInAt && (
                  <div style={{ color: "var(--green)", fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                    ✓ Entrou {new Date(rsvp.checkedInAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleCheckIn(rsvp)}
                disabled={loadingId === rsvp.id}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: 14,
                  background: rsvp.checkedInAt ? "var(--bg-soft)" : "var(--green)",
                  color: rsvp.checkedInAt ? "var(--ink-soft)" : "#fff",
                  flexShrink: 0
                }}
              >
                {loadingId === rsvp.id ? "..." : rsvp.checkedInAt ? "Desfazer" : "Dar entrada"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
