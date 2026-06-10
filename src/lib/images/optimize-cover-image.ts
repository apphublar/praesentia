export async function optimizeCoverImageBuffer(buffer: Buffer, contentType: string) {
  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(buffer).rotate().jpeg({ quality: 86, mozjpeg: true }).toBuffer();
    return {
      buffer: jpeg,
      contentType: "image/jpeg",
      extension: "jpg" as const
    };
  } catch (error) {
    console.warn("[optimize-cover-image] falha ao comprimir, usando original", error);
    const extension = contentType.includes("png") ? ("png" as const) : ("jpg" as const);
    return { buffer, contentType, extension };
  }
}
