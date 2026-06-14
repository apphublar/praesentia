import type { PhotoOverlayConfig } from "@/lib/images/photo-zone-instructions";

let bgRemovalModule: Promise<typeof import("@imgly/background-removal")> | null = null;

function loadBackgroundRemoval() {
  if (!bgRemovalModule) {
    bgRemovalModule = import("@imgly/background-removal");
  }
  return bgRemovalModule;
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
    const { removeBackground } = await loadBackgroundRemoval();
    const blob = await removeBackground(imageUrl, {
      model: "isnet",
      output: { format: "image/png", quality: 0.92 }
    });
    const src = URL.createObjectURL(blob);
    return { src, revoke: () => URL.revokeObjectURL(src) };
  } catch (error) {
    console.warn("[prepareHostPhotoForOverlay] remoção de fundo indisponível", error);
    return { src: imageUrl };
  }
}
