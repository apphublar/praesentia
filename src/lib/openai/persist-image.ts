import { createUploadUrl, getPublicMediaUrl } from "@/lib/storage/r2";

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
  const hasR2 =
    process.env.CLOUDFLARE_R2_BUCKET &&
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (hasR2) {
    const uploadUrl = await createUploadUrl({
      key: input.key,
      contentType: input.contentType,
      contentLength: buffer.byteLength
    });

    const putResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: buffer,
      headers: { "Content-Type": input.contentType }
    });

    if (!putResponse.ok) {
      throw new Error("Falha ao enviar imagem para o armazenamento.");
    }

    const publicUrl = getPublicMediaUrl(input.key);
    if (publicUrl) return publicUrl;
  }

  const base64 = buffer.toString("base64");
  return `data:${input.contentType};base64,${base64}`;
}
