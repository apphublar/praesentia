"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GuestMessage } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Avatar } from "@/components/app/ui/primitives";
import { formatGuestMessageDate } from "@/lib/events/format-guest-message-date";

const CARD_COLORS = ["var(--p-rose)", "var(--p-blue)", "var(--p-green)", "var(--p-lilac)", "var(--p-peach)", "var(--p-sand)"];

export function GuestMessagesCarousel({ messages }: { messages: GuestMessage[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = messages.length > 1;

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    if (!cards.length) return;
    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let minDistance = Infinity;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - trackCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closest = index;
      }
    });
    setActiveIndex(closest);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !hasMultiple) return;

    syncActiveIndex();
    track.addEventListener("scroll", syncActiveIndex, { passive: true });
    return () => track.removeEventListener("scroll", syncActiveIndex);
  }, [hasMultiple, messages.length, syncActiveIndex]);

  if (!messages.length) return null;

  return (
    <div className="guest-messages-carousel">
      <div className="guest-messages-carousel-shell">
        {hasMultiple ? (
          <button
            type="button"
            className="guest-messages-carousel-nav guest-messages-carousel-nav-prev"
            aria-label="Recado anterior"
            disabled={activeIndex === 0}
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          >
            <Icon name="arrowL" size={16} />
          </button>
        ) : null}

        <div ref={trackRef} className="guest-messages-carousel-track" aria-label="Recados públicos">
          {messages.map((message, index) => (
            <article key={message.id} className="guest-messages-carousel-card">
              <div
                className="guest-messages-carousel-card-media"
                style={{ background: CARD_COLORS[index % CARD_COLORS.length] }}
              >
                <Avatar name={message.authorName} size={42} />
              </div>
              <div className="guest-messages-carousel-card-body">
                <h3>{message.authorName}</h3>
                <p>{message.body}</p>
                <time className="guest-messages-carousel-date" dateTime={message.createdAt}>
                  {formatGuestMessageDate(message.createdAt)}
                </time>
              </div>
            </article>
          ))}
        </div>

        {hasMultiple ? (
          <button
            type="button"
            className="guest-messages-carousel-nav guest-messages-carousel-nav-next"
            aria-label="Próximo recado"
            disabled={activeIndex >= messages.length - 1}
            onClick={() => scrollToIndex(Math.min(messages.length - 1, activeIndex + 1))}
          >
            <Icon name="arrowR" size={16} />
          </button>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="guest-messages-carousel-dots" aria-label="Indicador de recados">
          {messages.map((message, index) => (
            <button
              key={message.id}
              type="button"
              className={`guest-messages-carousel-dot${index === activeIndex ? " is-active" : ""}`}
              aria-label={`Ir para recado ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
