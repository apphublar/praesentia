import { createUploadUrl, getPublicMediaUrl } from "@/lib/storage/r2";

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

export async function persistImageBuffer(input: {
  buffer: Buffer;
  key: string;
  contentType: string;
}) {
  const publicUrl = await uploadBufferToR2(input.buffer, input.key, input.contentType);
  if (publicUrl) return publicUrl;

  const base64 = input.buffer.toString("base64");
  return `data:${input.contentType};base64,${base64}`;
}

export async function persistRemoteImage(input: {
  sourceUrl: string;
  key: string;
  contentType: string;
}) {
  const response = await fetch(input.sourceUrl);
  if (!response.ok) {
    throw new Error("Falha ao baixar imagem gerada.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return persistImageBuffer({
    buffer,
    key: input.key,
    contentType: input.contentType
  });
}
