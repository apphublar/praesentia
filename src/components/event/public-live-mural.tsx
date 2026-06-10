"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GuestContributionPanel } from "@/components/event/guest-contribution-panel";
import { LikeButton } from "@/components/event/like-button";
import type { Event, MediaItem } from "@/types/domain";

export function PublicLiveMural({
  event,
  media,
  currentUserId,
  canUploadVideo = false
}: {
  event: Event;
  media: MediaItem[];
  currentUserId: string;
  canUploadVideo?: boolean;
}) {
  const [liveMedia, setLiveMedia] = useState(media);

  useEffect(() => {
    const source = new EventSource(`/api/events/${event.id}/stream`);
    function refreshSnapshot() {
      fetch(`/api/events/${event.id}`, { cache: "no-store" })
        .then((response) => response.json() as Promise<{ media?: MediaItem[] }>)
        .then((snapshot) => {
          if (snapshot.media) setLiveMedia(snapshot.media);
        })
        .catch(() => undefined);
    }

    source.addEventListener("media.created", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setLiveMedia((current) => [payload.item, ...current.filter((item) => item.id !== payload.item.id)]);
    });

    source.addEventListener("media.updated", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { item: MediaItem };
      setLiveMedia((current) =>
        current
          .map((item) => (item.id === payload.item.id ? payload.item : item))
          .filter((item) => item.status === "published")
      );
    });

    source.addEventListener("like.changed", (message) => {
      const payload = JSON.parse((message as MessageEvent).data) as { mediaId: string; likesCount: number };
      setLiveMedia((current) =>
        current.map((item) => (item.id === payload.mediaId ? { ...item, likesCount: payload.likesCount } : item))
      );
    });

    source.addEventListener("screen.changed", refreshSnapshot);
    return () => source.close();
  }, [event.id]);

  const guestItems = useMemo(
    () => liveMedia.filter((item) => item.userId === currentUserId),
    [currentUserId, liveMedia]
  );

  function addLocalMedia(item: MediaItem) {
    setLiveMedia((current) => [item, ...current.filter((row) => row.id !== item.id)]);
  }

  function removeLocalMedia(mediaId: string) {
    setLiveMedia((current) => current.filter((item) => item.id !== mediaId));
  }

  return (
    <section className="public-event-card public-event-live">
      <div className="public-event-live-head">
        <span className="public-event-live-badge">
          <span className="live-dot" /> mural ao vivo
        </span>
        <Link className="public-event-live-screen" href={`/evento/${event.slug}/telao`}>
          Abrir telão
        </Link>
      </div>
      <h2 className="public-event-section-title">Participe do mural</h2>
      <p className="public-event-message">
        Compartilhe fotos e recados em tempo real. Somente convidados confirmados com conta podem publicar aqui.
      </p>

      <GuestContributionPanel
        eventId={event.id}
        items={guestItems}
        currentUserId={currentUserId}
        canUploadVideo={canUploadVideo}
        onCreated={addLocalMedia}
        onDeleted={removeLocalMedia}
      />

      {liveMedia.length > 0 ? (
        <div className="public-event-mural-grid">
          {liveMedia.slice(0, 12).map((item) => (
            <article key={item.id} className="public-event-mural-item">
              {item.type === "message" ? (
                <p className="public-event-mural-message">"{item.text}"</p>
              ) : item.url || item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnailUrl ?? item.url} alt="" />
              ) : (
                <div className="public-event-mural-placeholder">{item.type === "video" ? "Vídeo" : "Foto"}</div>
              )}
              <footer>
                <span>{item.authorName}</span>
                <LikeButton eventId={item.eventId} mediaId={item.id} initialCount={item.likesCount} />
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <p className="public-event-message">Seja o primeiro a publicar uma memória deste evento.</p>
      )}
    </section>
  );
}
