import type { MediaItem } from "@/types/domain";
import { LikeButton } from "@/components/event/like-button";

export function MediaCard({
  item,
  featured = false,
  interactive = true
}: {
  item: MediaItem;
  featured?: boolean;
  interactive?: boolean;
}) {
  return (
    <article className="card" style={{ padding: 12 }}>
      {item.type === "message" ? (
        <div
          style={{
            minHeight: featured ? 260 : 150,
            display: "grid",
            placeItems: "center",
            background: "var(--gold)",
            borderRadius: 8,
            padding: 22,
            textAlign: "center",
            fontSize: featured ? 28 : 18,
            lineHeight: 1.25,
            fontWeight: 700
          }}
        >
          {item.text}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl || item.url}
          alt={`Conteudo compartilhado por ${item.authorName}`}
          style={{ width: "100%", aspectRatio: featured ? "16 / 10" : "4 / 3", objectFit: "cover", borderRadius: 8 }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 13 }}>
        <strong>{item.authorName}</strong>
        <span style={{ marginLeft: "auto" }}>
          {interactive ? (
            <LikeButton eventId={item.eventId} mediaId={item.id} initialCount={item.likesCount} />
          ) : (
            <span style={{ color: "var(--ink-soft)" }}>{item.likesCount} curtidas</span>
          )}
        </span>
      </div>
    </article>
  );
}
