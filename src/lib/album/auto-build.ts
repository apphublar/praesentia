import type { MediaItem } from "@/types/domain";
import {
  ALBUM_LAYOUT_SLOTS,
  ALBUM_MAX_PAGES,
  ALBUM_MIN_PAGES,
  MEMORY_TIMELINE_CHAPTERS,
  type AlbumLayoutId,
  type AlbumPage,
  type AlbumPhotoSlot
} from "@/lib/album/types";

function newPageId() {
  return `page-${crypto.randomUUID()}`;
}

function layoutForRemaining(remaining: number): AlbumLayoutId {
  if (remaining >= 4) return "quad";
  if (remaining === 3) return "triple";
  if (remaining === 2) return "double";
  return "single";
}

function chapterForPageIndex(pageIndex: number, totalPages: number) {
  const segment = Math.floor((pageIndex / totalPages) * MEMORY_TIMELINE_CHAPTERS.length);
  return MEMORY_TIMELINE_CHAPTERS[Math.min(segment, MEMORY_TIMELINE_CHAPTERS.length - 1)];
}

function buildSlots(media: MediaItem[]): AlbumPhotoSlot[] {
  return media.map((item) => ({
    mediaId: item.id,
    dateLabel: new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
    caption: item.caption || item.authorName
  }));
}

export function estimatePagesForPhotoCount(photoCount: number) {
  if (photoCount === 0) return ALBUM_MIN_PAGES;
  const estimated = Math.ceil(photoCount / 2.5);
  return Math.min(ALBUM_MAX_PAGES, Math.max(ALBUM_MIN_PAGES, estimated));
}

export function buildAlbumPagesFromPhotos(photos: MediaItem[], favoriteIds: string[] = []): AlbumPage[] {
  const favorites = new Set(favoriteIds);
  const sorted = [...photos].sort((a, b) => {
    const aFav = favorites.has(a.id) ? 0 : 1;
    const bFav = favorites.has(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  const targetPages = estimatePagesForPhotoCount(sorted.length);
  const pages: AlbumPage[] = [];
  let cursor = 0;

  for (let pageIndex = 0; pageIndex < targetPages; pageIndex += 1) {
    const remainingPhotos = sorted.length - cursor;
    const isMemoryBeat = pageIndex > 0 && pageIndex % 8 === 0 && remainingPhotos > 0;

    if (isMemoryBeat) {
      pages.push({
        id: newPageId(),
        layout: "memory",
        chapter: chapterForPageIndex(pageIndex, targetPages),
        slots: remainingPhotos > 0 ? buildSlots(sorted.slice(cursor, cursor + 1)) : [],
        memory: {
          text: "Uma lembrança que queremos guardar para sempre.",
          font: "serif"
        }
      });
      if (remainingPhotos > 0) cursor += 1;
      continue;
    }

    const layout = layoutForRemaining(Math.max(1, remainingPhotos));
    const slotCount = ALBUM_LAYOUT_SLOTS[layout];
    const chunk = sorted.slice(cursor, cursor + slotCount);
    pages.push({
      id: newPageId(),
      layout,
      chapter: chapterForPageIndex(pageIndex, targetPages),
      slots: buildSlots(chunk)
    });
    cursor += chunk.length;

    if (cursor >= sorted.length && pages.length < ALBUM_MIN_PAGES) {
      continue;
    }
    if (cursor >= sorted.length && pages.length >= ALBUM_MIN_PAGES) {
      break;
    }
  }

  while (pages.length < ALBUM_MIN_PAGES) {
    pages.push({
      id: newPageId(),
      layout: "memory",
      chapter: chapterForPageIndex(pages.length, ALBUM_MIN_PAGES),
      slots: [],
      memory: {
        text: "Espaço reservado para uma memória especial.",
        font: "serif"
      }
    });
  }

  return pages.slice(0, ALBUM_MAX_PAGES);
}
