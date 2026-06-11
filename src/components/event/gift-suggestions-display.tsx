import type { GiftSuggestion } from "@/types/domain";

export function GiftSuggestionsDisplay({ suggestions }: { suggestions: GiftSuggestion[] }) {
  if (!suggestions.length) return null;

  return (
    <article className="public-event-card public-gift-suggestions">
      <h2 className="public-event-section-title">Sugestões de presente</h2>
      <p className="public-event-message">
        O organizador compartilhou algumas ideias caso você queira presentear.
      </p>
      <ul className="public-gift-list">
        {suggestions.map((item) => (
          <li key={item.id} className="public-gift-item">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.title} className="public-gift-image" />
            ) : null}
            <div className="public-gift-copy">
              <strong>{item.title}</strong>
              {item.note ? <p>{item.note}</p> : null}
              {item.linkUrl ? (
                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer">
                  Ver link
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
