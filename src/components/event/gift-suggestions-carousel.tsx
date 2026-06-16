"use client";

import { useEffect, useRef, useState } from "react";
import type { GiftSuggestion } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";

const CARD_COLORS = ["var(--p-blue)", "var(--p-green)", "var(--p-rose)", "var(--p-lilac)", "var(--p-peach)", "var(--p-sand)"];

export function GiftSuggestionsCarousel({ suggestions }: { suggestions: GiftSuggestion[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (suggestions.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % suggestions.length;
        const track = trackRef.current;
        if (track) {
          const card = track.children[next] as HTMLElement | undefined;
          card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
        return next;
      });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [suggestions.length]);

  if (!suggestions.length) return null;

  return (
    <div className="gift-carousel">
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
      {suggestions.length > 1 ? (
        <div className="gift-carousel-dots" aria-hidden="true">
          {suggestions.map((item, index) => (
            <span key={item.id} className={`gift-carousel-dot${index === activeIndex ? " is-active" : ""}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
