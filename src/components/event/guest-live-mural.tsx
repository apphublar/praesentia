"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GuestContributionPanel } from "@/components/event/guest-contribution-panel";
import { LikeButton } from "@/components/event/like-button";
import { GuestPolaroidFrame } from "@/components/media/guest-polaroid-frame";
import { resolveMediaItemUrl } from "@/lib/storage/media-url";
import type { Event, MediaItem } from "@/types/domain";

export function GuestLiveMural({
  event,
  media,
  guestRsvpId,
  guestName,
  readOnly = false,
  confirmedGuestCount = 0
}: {
  event: Event;
  media: MediaItem[];
  guestRsvpId?: string;
  guestName?: string;
  readOnly?: boolean;
  confirmedGuestCount?: number;
}) {
  const [liveMedia, setLiveMedia] = useState(media);

  useEffect(() => {
    const source = new EventSource(`/api/events/${event.id}/stream`);
    function apply(items: MediaItem[]) {
      setLiveMedia(items);
    }
    source.addEventListener("media.created", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setLiveMedia((current) => [payload.item, ...current.filter((item) => item.id !== payload.item.id)]);
    });
    source.addEventListener("media.updated", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setLiveMedia((current) =>
        current.map((item) => (item.id === payload.item.id ? payload.item : item)).filter((item) => item.status === "published")
      );
    });
    source.addEventListener("like.changed", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { mediaId: string; likesCount: number };
      setLiveMedia((current) =>
        current.map((item) => (item.id === payload.mediaId ? { ...item, likesCount: payload.likesCount } : item))
      );
    });
    source.addEventListener("screen.changed", () => {
      fetch(`/api/events/${event.id}`, { cache: "no-store" })
        .then((response) => response.json() as Promise<{ media?: MediaItem[] }>)
        .then((snapshot) => snapshot.media && apply(snapshot.media))
        .catch(() => undefined);
    });
    return () => source.close();
  }, [event.id]);

  const guestItems = useMemo(
    () => (guestRsvpId ? liveMedia.filter((item) => item.guestRsvpId === guestRsvpId) : []),
    [guestRsvpId, liveMedia]
  );
  const totalLikes = liveMedia.reduce((sum, item) => sum + item.likesCount, 0);

  return (
    <section className="guest-live-mural">
      <div className="guest-live-mural-head">
        <div>
          <span className="public-event-live-badge"><span className="live-dot" /> mural ao vivo</span>
          {guestName ? <p className="public-event-message">Olá, <strong>{guestName}</strong></p> : null}
        </div>
        <Link className="public-event-live-screen" href={`/evento/${event.slug}/telao`}>
          Abrir telão
        </Link>
      </div>

      <div className="guest-live-mural-metrics">
        <div><strong>{confirmedGuestCount || "—"}</strong><span>presentes</span></div>
        <div><strong>{liveMedia.length}</strong><span>memórias</span></div>
        <div><strong>{totalLikes}</strong><span>curtidas</span></div>
        <div><strong>ao vivo</strong><span>sem refresh</span></div>
      </div>

      {!readOnly && guestRsvpId ? (
        <GuestContributionPanel
          eventId={event.id}
          items={guestItems}
          guestRsvpId={guestRsvpId}
          muralGuestMode
          onCreated={(item) => setLiveMedia((current) => [item, ...current.filter((row) => row.id !== item.id)])}
          onDeleted={(mediaId) => setLiveMedia((current) => current.filter((item) => item.id !== mediaId))}
        />
      ) : readOnly ? (
        <p className="public-event-message">O evento terminou. Você pode rever as memórias enquanto a cápsula estiver ativa.</p>
      ) : null}

      <div className="guest-live-mural-grid">
        {liveMedia.map((item) => {
          const imageUrl = resolveMediaItemUrl(event.id, item);
          if (item.type === "message") {
            return (
              <article key={item.id} className="guest-live-mural-card guest-live-mural-card-message">
                <div className="guest-live-mural-message">{item.text}</div>
                <footer className="guest-live-mural-card-footer">
                  <span>{item.authorName}</span>
                  {readOnly ? (
                    <span>{item.likesCount} curtidas</span>
                  ) : (
                    <LikeButton eventId={event.id} mediaId={item.id} initialCount={item.likesCount} guestMural />
                  )}
                </footer>
              </article>
            );
          }

          return (
            <GuestPolaroidFrame
              key={item.id}
              className="guest-live-mural-card"
              src={imageUrl ?? undefined}
              alt={item.caption || `Memória de ${item.authorName}`}
              caption={item.caption && item.type === "photo" ? item.caption : undefined}
              footer={
                <footer className="guest-live-mural-card-footer">
                  <span>{item.authorName}</span>
                  {readOnly ? (
                    <span>{item.likesCount} curtidas</span>
                  ) : (
                    <LikeButton eventId={event.id} mediaId={item.id} initialCount={item.likesCount} guestMural />
                  )}
                </footer>
              }
            />
          );
        })}
      </div>
    </section>
  );
}
