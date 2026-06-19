"use client";

import { useMemo } from "react";
import type { MediaItem } from "@/types/domain";
import { resolveMediaItemUrl } from "@/lib/storage/media-url";
import type { AlbumPhotoSlot } from "@/lib/album/types";

export function AlbumPolaroid({
  eventId,
  mediaById,
  slot,
  compact = false
}: {
  eventId: string;
  mediaById: Map<string, MediaItem>;
  slot?: AlbumPhotoSlot;
  compact?: boolean;
}) {
  const media = slot?.mediaId ? mediaById.get(slot.mediaId) : undefined;
  const src = media ? resolveMediaItemUrl(eventId, media) : null;

  return (
    <figure className={`album-polaroid${compact ? " is-compact" : ""}`}>
      <div className="album-polaroid-frame">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={slot?.caption || media?.authorName || "Foto do álbum"} />
        ) : (
          <div className="album-polaroid-empty">Foto</div>
        )}
      </div>
      {(slot?.caption || slot?.dateLabel || slot?.location || slot?.note) && (
        <figcaption className="album-polaroid-caption">
          {slot?.caption ? <strong>{slot.caption}</strong> : null}
          {slot?.dateLabel ? <span>{slot.dateLabel}</span> : null}
          {slot?.location ? <span>{slot.location}</span> : null}
          {slot?.note ? <em>{slot.note}</em> : null}
        </figcaption>
      )}
    </figure>
  );
}
