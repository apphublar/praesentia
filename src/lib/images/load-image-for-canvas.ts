/** Carrega imagem via blob para evitar canvas contaminado (CORS) em URLs externas ou proxy. */
export async function loadImageForCanvas(src: string): Promise<{ img: HTMLImageElement; revoke?: () => void }> {
  let blobUrl: string | null = null;
  let resolvedSrc = src;

  if (!src.startsWith("data:") && !src.startsWith("blob:")) {
    const response = await fetch(src, { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error("Não foi possível carregar a imagem.");
    }
    const blob = await response.blob();
    blobUrl = URL.createObjectURL(blob);
    resolvedSrc = blobUrl;
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      el.src = resolvedSrc;
    });
    return { img, revoke: blobUrl ? () => URL.revokeObjectURL(blobUrl!) : undefined };
  } catch (error) {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    throw error;
  }
}

export async function fetchImageBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:")) {
    const match = src.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Imagem inválida.");
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: match[1] || "image/jpeg" });
  }

  if (src.startsWith("blob:")) {
    const response = await fetch(src);
    if (!response.ok) throw new Error("Não foi possível carregar a imagem.");
    return response.blob();
  }

  const response = await fetch(src, { credentials: "same-origin" });
  if (!response.ok) throw new Error("Não foi possível carregar a imagem.");
  return response.blob();
}
