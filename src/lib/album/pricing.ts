import { ALBUM_MAX_PAGES, ALBUM_MIN_PAGES, ALBUM_PRICE_PER_PAGE_CENTS } from "@/lib/album/types";

export function clampAlbumPageCount(pages: number) {
  return Math.min(ALBUM_MAX_PAGES, Math.max(ALBUM_MIN_PAGES, pages));
}

export function formatAlbumCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function albumTotalCents(pageCount: number) {
  return clampAlbumPageCount(pageCount) * ALBUM_PRICE_PER_PAGE_CENTS;
}

export function countAlbumPhotos(pages: { slots: { mediaId: string }[] }[]) {
  return pages.reduce((sum, page) => sum + page.slots.filter((slot) => slot.mediaId).length, 0);
}
