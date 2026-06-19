"use client";

import { albumTotalCents, countAlbumPhotos, formatAlbumCurrency } from "@/lib/album/pricing";
import { ALBUM_MAX_PAGES, ALBUM_MIN_PAGES, ALBUM_PRICE_PER_PAGE_CENTS } from "@/lib/album/types";

export function AlbumPricingBar({
  pageCount,
  selectedPhotos,
  compact = false
}: {
  pageCount: number;
  selectedPhotos: number;
  compact?: boolean;
}) {
  const total = albumTotalCents(pageCount);
  const perPage = formatAlbumCurrency(ALBUM_PRICE_PER_PAGE_CENTS);

  return (
    <aside className={`album-pricing-bar${compact ? " is-compact" : ""}`}>
      <div className="album-pricing-stat">
        <span>Fotos selecionadas</span>
        <strong>{selectedPhotos}</strong>
      </div>
      <div className="album-pricing-stat">
        <span>Páginas</span>
        <strong>
          {pageCount} <small>({ALBUM_MIN_PAGES}–{ALBUM_MAX_PAGES})</small>
        </strong>
      </div>
      <div className="album-pricing-stat">
        <span>Valor por página</span>
        <strong>{perPage}</strong>
      </div>
      <div className="album-pricing-total">
        <span>Total estimado</span>
        <strong>{formatAlbumCurrency(total)}</strong>
      </div>
    </aside>
  );
}

export function AlbumReviewStats({ pages }: { pages: { slots: { mediaId: string }[] }[] }) {
  const photoCount = countAlbumPhotos(pages);
  const pageCount = pages.length;
  return (
    <div className="album-review-stats">
      <div>
        <span>Páginas</span>
        <strong>{pageCount}</strong>
      </div>
      <div>
        <span>Fotos</span>
        <strong>{photoCount}</strong>
      </div>
      <div>
        <span>Total</span>
        <strong>{formatAlbumCurrency(albumTotalCents(pageCount))}</strong>
      </div>
    </div>
  );
}
