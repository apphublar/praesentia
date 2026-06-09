"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Event, MediaItem } from "@/types/domain";
import { MediaCard } from "@/components/event/media-card";

export function LiveScreen({ event, initialItems }: { event: Event; initialItems: MediaItem[] }) {
  const [liveEvent, setLiveEvent] = useState(event);
  const [items, setItems] = useState(() => filterScreenItems(initialItems, event));
  const liveEventRef = useRef(event);
  const latest = items[0];
  const top3 = useMemo(() => [...items].sort((a, b) => b.likesCount - a.likesCount).slice(0, 3), [items]);

  useEffect(() => {
    liveEventRef.current = liveEvent;
  }, [liveEvent]);

  useEffect(() => {
    const source = new EventSource(`/api/events/${event.id}/stream`);

    source.addEventListener("media.created", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setItems((current) => filterScreenItems([payload.item, ...current.filter((item) => item.id !== payload.item.id)], liveEventRef.current));
    });

    source.addEventListener("media.updated", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setItems((current) =>
        filterScreenItems(
          current.map((item) => (item.id === payload.item.id ? payload.item : item)),
          liveEventRef.current
        )
      );
    });

    source.addEventListener("like.changed", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { mediaId: string; likesCount: number };
      setItems((current) =>
        current.map((item) => (item.id === payload.mediaId ? { ...item, likesCount: payload.likesCount } : item))
      );
    });

    source.addEventListener("screen.changed", () => {
      fetch(`/api/events/${event.id}`, { cache: "no-store" })
        .then((response) => response.json() as Promise<{ event?: Event; media?: MediaItem[] }>)
        .then((snapshot) => {
          if (!snapshot.event || !snapshot.media) return;
          setLiveEvent(snapshot.event);
          setItems(filterScreenItems(snapshot.media, snapshot.event));
        })
        .catch(() => undefined);
    });

    return () => source.close();
  }, [event.id]);

  return (
    <main
      className="live-screen-layout"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 0%, rgba(255,178,62,.12), transparent 28%), #0f0905",
        color: "#f7eedb",
        padding: 34,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, .72fr)",
        gap: 26,
        overflow: "hidden"
      }}
    >
      <section>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div className="mono" style={{ color: "#ffb23e", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>
              Praesentia ao vivo - mural do evento
            </div>
            <h1 className="display-i" style={{ margin: "6px 0 0", fontSize: "clamp(42px, 5vw, 78px)", lineHeight: .9 }}>
              {event.title}
            </h1>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <span style={{ border: "1px solid rgba(247,238,219,.18)", borderRadius: 999, padding: "6px 10px", color: "rgba(247,238,219,.72)", fontSize: 12 }}>
                última memória entra no destaque
              </span>
              <span style={{ border: "1px solid rgba(247,238,219,.18)", borderRadius: 999, padding: "6px 10px", color: "rgba(247,238,219,.72)", fontSize: 12 }}>
                ranking por curtidas confidenciais
              </span>
            </div>
          </div>
          {liveEvent.screen.showQrCode && (
            <div style={{ marginLeft: "auto", textAlign: "center" }}>
              <div style={{ width: 98, height: 98, background: "#f7eedb", borderRadius: 8, display: "grid", placeItems: "center", color: "#1b1209", fontSize: 9 }} className="mono">
                QR
              </div>
              <div className="mono" style={{ marginTop: 8, fontSize: 11, color: "rgba(247,238,219,.72)", textTransform: "uppercase" }}>
                envie sua memória
              </div>
            </div>
          )}
        </div>
        {latest && (
          <div style={{ color: "var(--ink)", transform: "rotate(-.7deg)", maxHeight: "calc(100vh - 190px)" }}>
            <div className="polaroid" style={{ padding: 16, paddingBottom: 20, boxShadow: "0 24px 80px rgba(0,0,0,.38)" }}>
              <MediaCard item={latest} featured interactive={false} />
            </div>
          </div>
        )}
        {!latest && (
          <div style={{ border: "1px solid rgba(247,238,219,.16)", borderRadius: 18, padding: 28, color: "rgba(247,238,219,.72)" }}>
            <h2 className="display-i" style={{ color: "#f7eedb", fontSize: 42, margin: 0 }}>
              {liveEvent.screen.paused ? "Telão pausado." : "Aguardando memórias."}
            </h2>
            <p style={{ marginBottom: 0 }}>
              {liveEvent.screen.enabled ? "As próximas publicações aprovadas para o telão aparecem aqui." : "O responsável desativou o telão deste evento."}
            </p>
          </div>
        )}
        <div className="live-screen-metrics" style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[["47", "presentes"], [String(items.length), "memórias"], [String(items.reduce((sum, item) => sum + item.likesCount, 0)), "curtidas"], ["ao vivo", "sem refresh"]].map(([value, label]) => (
            <div key={label} style={{ background: "rgba(247,238,219,.06)", border: "1px solid rgba(247,238,219,.13)", borderRadius: 14, padding: 14 }}>
              <div className="display" style={{ fontSize: 34, lineHeight: 1, color: value === "ao vivo" ? "#ffb23e" : "#f7eedb" }}>{value}</div>
              <div className="mono" style={{ fontSize: 10, color: "rgba(247,238,219,.58)", textTransform: "uppercase", marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>
      <aside>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#ffb23e" }} className="live-dot" />
          <h2 className="display-i" style={{ margin: 0, fontSize: 34 }}>Mais curtidos agora</h2>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {top3.map((item) => (
            <div key={item.id} className="polaroid" style={{ color: "var(--ink)", padding: 10, paddingBottom: 16 }}>
              <MediaCard item={item} interactive={false} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, background: "rgba(247,238,219,.08)", border: "1px solid rgba(247,238,219,.16)", borderRadius: 16, padding: 18 }}>
          <div className="mono" style={{ color: "#ffb23e", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>curtidas confidenciais</div>
          <p style={{ color: "rgba(247,238,219,.72)", lineHeight: 1.5, fontSize: 13 }}>
            O telão mostra apenas a quantidade total. Quem curtiu continua privado.
          </p>
        </div>
        <div style={{ marginTop: 16, background: "#f7eedb", color: "#1b1209", borderRadius: 16, padding: 18 }}>
          <div className="mono" style={{ color: "rgba(27,18,9,.6)", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>participar da cápsula</div>
          <div style={{ display: "grid", gridTemplateColumns: "86px 1fr", gap: 14, alignItems: "center", marginTop: 12 }}>
            <div className="mono" style={{ width: 86, height: 86, borderRadius: 8, background: "#1b1209", color: "#f7eedb", display: "grid", placeItems: "center", fontSize: 10 }}>
              QR
            </div>
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>Confirme presença e crie sua conta.</div>
              <p style={{ color: "var(--ink-soft)", lineHeight: 1.45, fontSize: 12, margin: "6px 0 0" }}>
                Somente convidados confirmados podem postar fotos, vídeos e recados.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

function filterScreenItems(items: MediaItem[], event: Event) {
  if (!event.screen.enabled || event.screen.paused) return [];

  return items.filter((item) => {
    if (item.status !== "published" || !item.visibleOnScreen) return false;
    if (item.type === "video" && !event.screen.showVideos) return false;
    if (item.type === "message" && !event.screen.showMessages) return false;
    return true;
  });
}
