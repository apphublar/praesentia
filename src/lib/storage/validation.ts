const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime"
]);

const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 180 * 1024 * 1024;

export function validateUploadRequest(contentType: string, size: number) {
  if (!ALLOWED_TYPES.has(contentType)) {
    return { ok: false, error: "Tipo de arquivo nao permitido." };
  }

  const isVideo = contentType.startsWith("video/");
  const max = isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
  if (size <= 0 || size > max) {
    return { ok: false, error: "Arquivo fora do limite permitido." };
  }

  return { ok: true, isVideo };
}
