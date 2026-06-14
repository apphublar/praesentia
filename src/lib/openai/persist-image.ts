import { createUploadUrl, getPublicMediaUrl } from "@/lib/storage/r2";

const DEFAULT_MAX_DATA_URL_BYTES = 4_000_000;

export function buildAppImageUrl(eventId: string, key: string) {
  return `/api/events/${eventId}/image?key=${encodeURIComponent(key)}`;
}

function resolveFetchUrl(url: string) {
  if (!url.startsWith("/")) return url;

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return `${base}${url}`;
}

/** Baixa imagem remota (R2, proxy do app, etc.) como data URL para APIs de imagem. */
export async function fetchRemoteImageAsDataUrl(url: string, maxBytes = DEFAULT_MAX_DATA_URL_BYTES) {
  try {
    const response = await fetch(resolveFetchUrl(url), { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) return null;
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

async function uploadBufferToR2(buffer: Buffer, key: string, contentType: string) {
  const hasR2 =
    process.env.CLOUDFLARE_R2_BUCKET &&
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!hasR2) return null;

  const uploadUrl = await createUploadUrl({
    key,
    contentType,
    contentLength: buffer.byteLength
  });

  const putResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: new Uint8Array(buffer),
    headers: { "Content-Type": contentType }
  });

  if (!putResponse.ok) {
    throw new Error("Falha ao enviar imagem para o armazenamento.");
  }

  return getPublicMediaUrl(key);
}

export async function verifyPublicImageUrl(url: string) {
  if (url.startsWith("data:")) return true;

  try {
    const response = await fetch(resolveFetchUrl(url), {
      method: "GET",
      headers: { Range: "bytes=0-255" },
      signal: AbortSignal.timeout(8000)
    });
    return response.ok || response.status === 206;
  } catch {
    return false;
  }
}

function toDataUrl(buffer: Buffer, contentType: string) {
  const base64 = buffer.toString("base64");
  return `data:${contentType};base64,${base64}`;
}

export async function persistImageBuffer(input: {
  buffer: Buffer;
  key: string;
  contentType: string;
  preferDataUrlBelowBytes?: number;
  maxDataUrlBytes?: number;
  eventId?: string;
  forceDataUrl?: boolean;
}) {
  const preferDataUrlBelowBytes = input.preferDataUrlBelowBytes ?? 1_500_000;
  const maxDataUrlBytes = input.maxDataUrlBytes ?? DEFAULT_MAX_DATA_URL_BYTES;

  if (input.forceDataUrl && input.buffer.byteLength <= maxDataUrlBytes) {
    return toDataUrl(input.buffer, input.contentType);
  }

  let uploadedToR2 = false;
  let publicUrl: string | null = null;

  try {
    publicUrl = await uploadBufferToR2(input.buffer, input.key, input.contentType);
    uploadedToR2 = Boolean(publicUrl);
    if (publicUrl && (await verifyPublicImageUrl(publicUrl))) {
      return publicUrl;
    }
  } catch {
    uploadedToR2 = false;
    publicUrl = null;
  }

  if (input.buffer.byteLength <= preferDataUrlBelowBytes || input.buffer.byteLength <= maxDataUrlBytes) {
    return toDataUrl(input.buffer, input.contentType);
  }

  if (uploadedToR2 && input.eventId) {
    const proxyUrl = buildAppImageUrl(input.eventId, input.key);
    if (await verifyPublicImageUrl(proxyUrl)) {
      return proxyUrl;
    }
  }

  throw new Error("Falha ao publicar imagem. Tente novamente ou envie um arquivo menor.");
}

export async function persistRemoteImage(input: {
  sourceUrl: string;
  key: string;
  contentType: string;
  eventId?: string;
}) {
  const response = await fetch(input.sourceUrl);
  if (!response.ok) {
    throw new Error("Falha ao baixar imagem gerada.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return persistImageBuffer({
    buffer,
    key: input.key,
    contentType: input.contentType,
    eventId: input.eventId,
    preferDataUrlBelowBytes: DEFAULT_MAX_DATA_URL_BYTES,
    maxDataUrlBytes: DEFAULT_MAX_DATA_URL_BYTES
  });
}
