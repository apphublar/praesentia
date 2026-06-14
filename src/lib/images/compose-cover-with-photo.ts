import { loadImageForCanvas } from "@/lib/images/load-image-for-canvas";
import type { PhotoOverlayConfig } from "@/lib/images/photo-zone-instructions";
import { photoSizePercent } from "@/lib/images/photo-zone-instructions";
import { prepareHostPhotoForOverlay, shouldRemoveHostPhotoBackground } from "@/lib/images/prepare-host-photo";

type PhotoPlacement = { x: number; y: number; drawW: number; drawH: number };

function computePhotoPlacement(
  canvasW: number,
  canvasH: number,
  photo: PhotoOverlayConfig,
  host: HTMLImageElement
): PhotoPlacement {
  const baseSize = canvasW * photoSizePercent(photo.size);
  const margin = canvasW * 0.06;

  let drawW = baseSize;
  let drawH = baseSize;

  if (photo.shape === "original") {
    const ratio = host.naturalWidth / host.naturalHeight || 1;
    drawW = baseSize;
    drawH = baseSize / ratio;
    let maxH = canvasH * 0.42;
    if (photo.pos.startsWith("t")) maxH = canvasH * 0.3;
    else if (photo.pos.startsWith("b")) maxH = canvasH * 0.36;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }
  }

  let x = margin;
  let y = margin;

  if (photo.pos.endsWith("c")) x = (canvasW - drawW) / 2;
  else if (photo.pos.endsWith("r")) x = canvasW - drawW - margin;

  if (photo.pos.startsWith("m")) y = (canvasH - drawH) / 2;
  else if (photo.pos.startsWith("b")) y = canvasH - drawH - margin;

  return { x, y, drawW, drawH };
}

function clipPhotoFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  drawW: number,
  drawH: number,
  shape: PhotoOverlayConfig["shape"]
) {
  ctx.beginPath();
  if (shape === "round") {
    const radius = Math.min(drawW, drawH) / 2;
    ctx.arc(x + drawW / 2, y + drawH / 2, radius, 0, Math.PI * 2);
  } else if (shape === "square") {
    const r = Math.min(drawW, drawH) * 0.12;
    ctx.roundRect(x, y, drawW, drawH, r);
  } else {
    ctx.rect(x, y, drawW, drawH);
  }
  ctx.clip();
}

function drawHostPhoto(
  ctx: CanvasRenderingContext2D,
  host: HTMLImageElement,
  placement: PhotoPlacement,
  shape: PhotoOverlayConfig["shape"]
) {
  const { x, y, drawW, drawH } = placement;

  if (shape === "original") {
    ctx.drawImage(host, x, y, drawW, drawH);
    return;
  }

  const scale = Math.max(drawW / host.naturalWidth, drawH / host.naturalHeight);
  const scaledW = host.naturalWidth * scale;
  const scaledH = host.naturalHeight * scale;
  const dx = x + (drawW - scaledW) / 2;
  const dy = y + (drawH - scaledH) / 2;
  ctx.drawImage(host, dx, dy, scaledW, scaledH);
}

export async function composeCoverWithHostPhoto(coverUrl: string, photo: PhotoOverlayConfig): Promise<Blob> {
  if (!photo.imageUrl) throw new Error("Foto do homenageado ausente.");

  const prepared = await prepareHostPhotoForOverlay(photo.imageUrl, photo);
  const coverLoaded = await loadImageForCanvas(coverUrl);
  const hostLoaded = await loadImageForCanvas(prepared.src);
  try {
    const cover = coverLoaded.img;
    const host = hostLoaded.img;
    const width = cover.naturalWidth || 1024;
    const height = cover.naturalHeight || Math.round((width * 16) / 9);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");

    ctx.drawImage(cover, 0, 0, width, height);

    const placement = computePhotoPlacement(width, height, photo, host);
    const bgRemoved = shouldRemoveHostPhotoBackground(photo);

    ctx.save();
    clipPhotoFrame(ctx, placement.x, placement.y, placement.drawW, placement.drawH, photo.shape);
    if (bgRemoved || photo.shape === "original") {
      ctx.shadowColor = "rgba(0,0,0,.28)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
    }
    drawHostPhoto(ctx, host, placement, photo.shape);
    ctx.restore();

    const usePng = shouldRemoveHostPhotoBackground(photo);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, usePng ? "image/png" : "image/jpeg", usePng ? undefined : 0.92)
    );
    if (!blob) throw new Error("Falha ao compor a capa.");
    return blob;
  } finally {
    prepared.revoke?.();
    coverLoaded.revoke?.();
    hostLoaded.revoke?.();
  }
}

export async function uploadComposedCover(eventId: string, blob: Blob) {
  const ext = blob.type.includes("png") ? "png" : "jpg";
  const formData = new FormData();
  formData.append("file", blob, `cover-composed.${ext}`);
  const res = await fetch(`/api/events/${eventId}/cover/compose`, {
    method: "POST",
    body: formData,
    credentials: "same-origin"
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Erro ao salvar capa composta.");
  }
  return String(data.coverImageUrl);
}
