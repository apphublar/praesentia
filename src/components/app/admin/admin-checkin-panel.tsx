"use client";

import { useMemo, useState } from "react";
import type { GuestRsvp } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Avatar, Mono } from "@/components/app/ui/primitives";
import { guestPartySize, sumPartySize } from "@/lib/guests/rsvp-display";

function FakeQr() {
  return (
    <div
      style={{
        width: 120,
        height: 120,
        margin: "0 auto 14px",
        borderRadius: 14,
        background: "#fff",
        border: "1px solid var(--line)",
        display: "grid",
        gridTemplateColumns: "repeat(6,1fr)",
        gridTemplateRows: "repeat(6,1fr)",
        gap: 2,
        padding: 12
      }}
    >
      {Array.from({ length: 36 }).map((_, i) => (
        <span
          key={i}
          style={{
            borderRadius: 1,
            background: (i * 7 + 3) % 3 === 0 || [0, 1, 5, 6, 11, 12, 30, 31, 35, 18, 24].includes(i) ? "var(--ink)" : "transparent"
          }}
        />
      ))}
    </div>
  );
}

export function AdminCheckinPanel({
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
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const confirmed = useMemo(() => rsvps.filter((g) => g.rsvpStatus === "confirmed"), [rsvps]);
  const totalPeople = useMemo(() => sumPartySize(confirmed), [confirmed]);
  const arrived = useMemo(() => sumPartySize(confirmed.filter((g) => g.checkedInAt)), [confirmed]);

  const portariaLink =
    typeof window !== "undefined" && eventFreeCode
      ? `${window.location.origin}/evento/${eventSlug}/portaria?token=${eventFreeCode}`
      : eventFreeCode
        ? `/evento/${eventSlug}/portaria?token=${eventFreeCode}`
        : "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return confirmed;
    return confirmed.filter((g) => g.guestName.toLowerCase().includes(q));
  }, [confirmed, search]);

  async function copyLink() {
    if (!portariaLink) return;
    await navigator.clipboard.writeText(portariaLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleCheckIn(rsvp: GuestRsvp) {
    setLoadingId(rsvp.id);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvpId: rsvp.id, action: rsvp.checkedInAt ? "undo" : "check_in" })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.rsvp) {
        setRsvps((current) => current.map((item) => (item.id === rsvp.id ? data.rsvp : item)));
      } else {
        setError(typeof data.error === "string" ? data.error : "Não foi possível registrar a chegada.");
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(240px,300px) 1fr", gap: 24, alignItems: "start" }}>
      <div className="card" style={{ padding: 22, position: "sticky", top: 0 }}>
        <Mono style={{ display: "block", marginBottom: 6 }}>Link da portaria</Mono>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
          Um link separado para quem recepciona — sem acesso ao painel.
        </p>
        <FakeQr />
        <button type="button" className="btn btn-dark btn-sm" style={{ width: "100%" }} disabled={!portariaLink} onClick={copyLink}>
          <Icon name="link" size={14} />
          {copied ? "Link copiado!" : "Copiar link da portaria"}
        </button>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <div style={{ textAlign: "center" }}>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--coral-deep)" }}>
              {arrived}
            </div>
            <div className="mono" style={{ fontSize: 9 }}>
              chegaram
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600 }}>
              {totalPeople}
            </div>
            <div className="mono" style={{ fontSize: 9 }}>
              esperados
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h3 className="serif-i" style={{ fontSize: 20, margin: 0 }}>
            Lista da portaria
          </h3>
          <div className="card-flat" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", background: "#fff" }}>
            <Icon name="search" size={15} style={{ color: "var(--muted)" }} />
            <input
              placeholder="Buscar nome…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 13, width: 140 }}
            />
          </div>
        </div>
        {error ? <p style={{ color: "var(--coral-deep)", fontSize: 13 }}>{error}</p> : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((g) => {
            const on = Boolean(g.checkedInAt);
            const party = guestPartySize(g);
            return (
              <div
                key={g.id}
                className="card-flat"
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 16px",
                  background: on ? "var(--card-2)" : "#fff",
                  transition: "background .15s"
                }}
              >
                <Avatar name={g.guestName} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{g.guestName}</div>
                  <div className="mono" style={{ fontSize: 9 }}>
                    {party > 1 ? `${party} pessoas` : "1 pessoa"}
                  </div>
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
                  {loadingId === g.id ? (
                    "…"
                  ) : on ? (
                    <>
                      <Icon name="check" size={14} sw={2.4} />
                      Na festa
                    </>
                  ) : (
                    "Marcar chegada"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
