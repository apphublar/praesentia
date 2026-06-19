import { albumTotalCents, countAlbumPhotos } from "@/lib/album/pricing";
import { ALBUM_MAX_PAGES, ALBUM_MIN_PAGES, type PhotoAlbumDraft } from "@/lib/album/types";

export type AlbumValidationResult = { ok: true } | { ok: false; errors: string[] };

export function validateAlbumDraft(draft: PhotoAlbumDraft, allowedMediaIds: Set<string>): AlbumValidationResult {
  const errors: string[] = [];

  if (draft.pages.length < ALBUM_MIN_PAGES) {
    errors.push(`O álbum precisa de pelo menos ${ALBUM_MIN_PAGES} páginas.`);
  }
  if (draft.pages.length > ALBUM_MAX_PAGES) {
    errors.push(`O álbum pode ter no máximo ${ALBUM_MAX_PAGES} páginas.`);
  }

  const photoCount = countAlbumPhotos(draft.pages);
  if (photoCount < 1) {
    errors.push("Inclua pelo menos uma foto no álbum.");
  }

  for (const page of draft.pages) {
    for (const slot of page.slots) {
      if (slot.mediaId && !allowedMediaIds.has(slot.mediaId)) {
        errors.push("Uma ou mais fotos não estão mais disponíveis na cápsula.");
        break;
      }
    }
  }

  if (!draft.cover.title.trim()) {
    errors.push("Informe o título da capa.");
  }

  const expectedTotal = albumTotalCents(draft.pages.length);
  if (expectedTotal <= 0) {
    errors.push("Valor do álbum inválido.");
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
