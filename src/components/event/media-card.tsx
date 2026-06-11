import type { MediaItem } from "@/types/domain";
import { LikeButton } from "@/components/event/like-button";
import { resolveMediaItemUrl } from "@/lib/storage/media-url";

export function MediaCard({
  item,
  featured = false,
  interactive = true
}: {
  item: MediaItem;
  featured?: boolean;
  interactive?: boolean;
}) {
  const imageUrl = resolveMediaItemUrl(item.eventId, item);

  return (
    <article className="media-card-shell" style={{ padding: featured ? 16 : 12 }}>
      {item.type === "message" ? (
        <div className="media-card-message" data-featured={featured ? "true" : "false"}>
          {item.text}
        </div>
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={item.caption || `Conteúdo compartilhado por ${item.authorName}`}
          className="media-card-photo"
          data-featured={featured ? "true" : "false"}
        />
      ) : (
        <div className="media-card-message" data-featured={featured ? "true" : "false"}>
          {item.caption || "Memória"}
        </div>
      )}
      {item.caption && item.type === "photo" ? <p className="media-card-caption">{item.caption}</p> : null}
      <div className="media-card-footer">
        <strong>{item.authorName}</strong>
        <span style={{ marginLeft: "auto" }}>
          {interactive ? (
            <LikeButton eventId={item.eventId} mediaId={item.id} initialCount={item.likesCount} guestMural />
          ) : (
            <span style={{ color: "var(--ink-soft)" }}>{item.likesCount} curtidas</span>
          )}
        </span>
      </div>
    </article>
  );
}
