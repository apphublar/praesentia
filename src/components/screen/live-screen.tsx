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
  const totalLikes = items.reduce((sum, item) => sum + item.likesCount, 0);

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
    <main className="live-screen-layout">
      <section className="live-screen-main">
        <div className="live-screen-heading">
          <div>
            <div className="live-screen-kicker">Praesentia ao vivo — mural do evento</div>
            <h1 className="display-i live-screen-title">{event.title}</h1>
          </div>
        </div>

        <div className="live-screen-metrics">
          <div><strong>{items.length}</strong><span>memórias</span></div>
          <div><strong>{totalLikes}</strong><span>curtidas</span></div>
          <div><strong>ao vivo</strong><span>sem refresh</span></div>
        </div>

        {latest ? (
          <div className="live-screen-featured">
            <div className="polaroid live-screen-featured-card">
              <MediaCard item={latest} featured interactive />
            </div>
          </div>
        ) : (
          <div className="live-screen-empty">
            <h2 className="display-i">{liveEvent.screen.paused ? "Telão pausado." : "Aguardando memórias."}</h2>
            <p>{liveEvent.screen.enabled ? "As publicações aprovadas aparecem aqui em tempo real." : "O responsável desativou o telão."}</p>
          </div>
        )}
      </section>

      <aside className="live-screen-sidebar">
        <div className="live-screen-sidebar-head">
          <span className="live-dot" />
          <h2 className="display-i">Mais curtidos agora</h2>
        </div>
        <div className="live-screen-sidebar-grid">
          {top3.map((item) => (
            <div key={item.id} className="polaroid live-screen-side-card">
              <MediaCard item={item} interactive />
            </div>
          ))}
        </div>
        <p className="live-screen-privacy-note">
          Curtidas anônimas — o telão mostra apenas o total. Quem curtiu permanece privado.
        </p>
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
