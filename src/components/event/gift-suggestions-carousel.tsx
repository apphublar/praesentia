"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GiftSuggestion } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";

const CARD_COLORS = ["var(--p-blue)", "var(--p-green)", "var(--p-rose)", "var(--p-lilac)", "var(--p-peach)", "var(--p-sand)"];

export function GiftSuggestionsCarousel({ suggestions }: { suggestions: GiftSuggestion[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = suggestions.length > 1;

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
  }, [hasMultiple, suggestions.length, syncActiveIndex]);

  if (!suggestions.length) return null;

  return (
    <div className="gift-carousel">
      <div className="gift-carousel-shell">
        {hasMultiple ? (
          <button
            type="button"
            className="gift-carousel-nav gift-carousel-nav-prev"
            aria-label="Sugestão anterior"
            disabled={activeIndex === 0}
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          >
            <Icon name="arrowL" size={16} />
          </button>
        ) : null}

        <div ref={trackRef} className="gift-carousel-track" aria-label="Sugestões de presente">
          {suggestions.map((item, index) => (
            <article key={item.id} className="gift-carousel-card">
              <div className="gift-carousel-card-media" style={{ background: CARD_COLORS[index % CARD_COLORS.length] }}>
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="gift-carousel-card-image" />
                ) : (
                  <Icon name="gift" size={28} style={{ color: "#3a3127" }} />
                )}
              </div>
              <div className="gift-carousel-card-body">
                <h3>{item.title}</h3>
                {item.note ? <p>{item.note}</p> : null}
                {item.linkUrl ? (
                  <a
                    className="btn btn-coral btn-sm gift-carousel-card-cta"
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Ver presente
                    <Icon name="arrowR" size={13} />
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {hasMultiple ? (
          <button
            type="button"
            className="gift-carousel-nav gift-carousel-nav-next"
            aria-label="Próxima sugestão"
            disabled={activeIndex >= suggestions.length - 1}
            onClick={() => scrollToIndex(Math.min(suggestions.length - 1, activeIndex + 1))}
          >
            <Icon name="arrowR" size={16} />
          </button>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="gift-carousel-dots" aria-label="Indicador de sugestões">
          {suggestions.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`gift-carousel-dot${index === activeIndex ? " is-active" : ""}`}
              aria-label={`Ir para sugestão ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
