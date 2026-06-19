import type { PhotoAlbumDraft } from "@/lib/album/types";

const STORAGE_PREFIX = "praesentia-photo-album";

function storageKey(eventId: string) {
  return `${STORAGE_PREFIX}:${eventId}`;
}

export function loadPhotoAlbumDraft(eventId: string): PhotoAlbumDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(eventId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PhotoAlbumDraft;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePhotoAlbumDraft(eventId: string, draft: PhotoAlbumDraft) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(eventId), JSON.stringify(draft));
}

export function createDefaultAlbumDraft(eventTitle: string, hostName?: string): PhotoAlbumDraft {
  const title = hostName?.trim() ? `${hostName.trim()} — memórias` : `${eventTitle} — memórias`;
  return {
    version: 1,
    step: "select",
    selectedPhotoIds: [],
    favoritePhotoIds: [],
    pages: [],
    cover: {
      title,
      color: "black",
      style: "elegant"
    },
    status: "draft"
  };
}
