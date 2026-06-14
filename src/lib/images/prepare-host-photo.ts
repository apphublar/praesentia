import type { PhotoOverlayConfig } from "@/lib/images/photo-zone-instructions";
import { fetchImageBlob } from "@/lib/images/load-image-for-canvas";

let bgRemovalModule: Promise<typeof import("@imgly/background-removal")> | null = null;

function loadBackgroundRemoval() {
  if (!bgRemovalModule) {
    bgRemovalModule = import("@imgly/background-removal");
  }
  return bgRemovalModule;
}

export class BackgroundRemovalError extends Error {
  constructor(message = "Não foi possível remover o fundo da foto. Verifique sua conexão e tente novamente.") {
    super(message);
    this.name = "BackgroundRemovalError";
  }
}

export function shouldRemoveHostPhotoBackground(photo: Pick<PhotoOverlayConfig, "removeBackground">) {
  return Boolean(photo.removeBackground);
}

/** Prepara a foto do homenageado para composição (remoção opcional de fundo). */
export async function prepareHostPhotoForOverlay(
  imageUrl: string,
  photo: Pick<PhotoOverlayConfig, "removeBackground">
): Promise<{ src: string; revoke?: () => void }> {
  if (!shouldRemoveHostPhotoBackground(photo)) {
    return { src: imageUrl };
  }

  try {
    const source = await fetchImageBlob(imageUrl);
    const { removeBackground } = await loadBackgroundRemoval();
    const blob = await removeBackground(source, {
      model: "isnet",
      output: { format: "image/png", quality: 0.92 }
    });
    const src = URL.createObjectURL(blob);
    return { src, revoke: () => URL.revokeObjectURL(src) };
  } catch (error) {
    console.warn("[prepareHostPhotoForOverlay] remoção de fundo falhou", error);
    throw new BackgroundRemovalError();
  }
}
