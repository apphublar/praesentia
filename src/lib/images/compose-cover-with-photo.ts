import type { PhotoOverlayConfig } from "@/components/app/ui/invite-art";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    img.src = src;
  });
}

function photoRect(width: number, height: number, photo: PhotoOverlayConfig) {
  const size = width * 0.29;
  const margin = width * 0.06;
  let x = margin;
  let y = margin;

  if (photo.pos.endsWith("c")) x = (width - size) / 2;
  else if (photo.pos.endsWith("r")) x = width - size - margin;

  if (photo.pos.startsWith("m")) y = (height - size) / 2;
  else if (photo.pos.startsWith("b")) y = height - size - margin;

  return { x, y, size };
}

function drawPhotoFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: PhotoOverlayConfig["shape"]
) {
  ctx.save();
  ctx.beginPath();
  const radius = shape === "round" ? size / 2 : shape === "square" ? size * 0.12 : size * 0.16;
  if (shape === "round") {
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  } else {
    const r = Math.min(radius, size / 2);
    ctx.roundRect(x, y, size, size, r);
  }
  ctx.clip();
}

export async function composeCoverWithHostPhoto(coverUrl: string, photo: PhotoOverlayConfig): Promise<Blob> {
  if (!photo.imageUrl) throw new Error("Foto do homenageado ausente.");

  const [cover, host] = await Promise.all([loadImage(coverUrl), loadImage(photo.imageUrl)]);
  const width = cover.naturalWidth || 1024;
  const height = cover.naturalHeight || Math.round(width * 1.25);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");

  ctx.drawImage(cover, 0, 0, width, height);

  const { x, y, size } = photoRect(width, height, photo);
  const ring = photo.shape !== "cutout";

  if (ring) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    const radius = photo.shape === "round" ? size / 2 : size * 0.12;
    if (photo.shape === "round") ctx.arc(x + size / 2, y + size / 2, size / 2 + 3, 0, Math.PI * 2);
    else ctx.roundRect(x - 3, y - 3, size + 6, size + 6, radius);
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  drawPhotoFrame(ctx, x, y, size, photo.shape);
  ctx.drawImage(host, x, y, size, size);
  ctx.restore();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
  if (!blob) throw new Error("Falha ao compor a capa.");
  return blob;
}

export async function uploadComposedCover(eventId: string, blob: Blob) {
  const formData = new FormData();
  formData.append("file", blob, "cover-composed.png");
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
