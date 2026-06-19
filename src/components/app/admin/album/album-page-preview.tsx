"use client";

import type { AlbumPage } from "@/lib/album/types";
import { ALBUM_LAYOUT_LABELS } from "@/lib/album/types";
import type { MediaItem } from "@/types/domain";
import { AlbumPolaroid } from "@/components/app/admin/album/album-polaroid";

export function AlbumPagePreview({
  eventId,
  page,
  mediaById,
  spread = false
}: {
  eventId: string;
  page: AlbumPage;
  mediaById: Map<string, MediaItem>;
  spread?: boolean;
}) {
  return (
    <div className={`album-page-preview${spread ? " is-spread" : ""}`}>
      {page.chapter ? <div className="album-page-chapter">✨ {page.chapter}</div> : null}
      <div className={`album-page-layout layout-${page.layout}`}>
        {page.layout === "memory" ? (
          <div className="album-memory-layout">
            <AlbumPolaroid eventId={eventId} mediaById={mediaById} slot={page.slots[0]} />
            <blockquote className={`album-memory-quote font-${page.memory?.font || "serif"}`}>
              {page.memory?.text || "Escreva um recado para esta página."}
            </blockquote>
          </div>
        ) : page.layout === "highlight" ? (
          <>
            <AlbumPolaroid eventId={eventId} mediaById={mediaById} slot={page.slots[0]} />
            <div className="album-highlight-secondary">
              <AlbumPolaroid eventId={eventId} mediaById={mediaById} slot={page.slots[1]} compact />
              <AlbumPolaroid eventId={eventId} mediaById={mediaById} slot={page.slots[2]} compact />
            </div>
          </>
        ) : (
          page.slots.map((slot, index) => (
            <AlbumPolaroid key={`${page.id}-${index}`} eventId={eventId} mediaById={mediaById} slot={slot} compact={page.layout === "quad"} />
          ))
        )}
      </div>
      <div className="album-page-layout-label">{ALBUM_LAYOUT_LABELS[page.layout]}</div>
    </div>
  );
}
