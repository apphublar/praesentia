import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconDir = join(root, "public", "icons");
const svg = readFileSync(join(iconDir, "icon.svg"), "utf8");

async function writeIcon(size, filename, padding = 0) {
  const output = join(iconDir, filename);
  let pipeline = sharp(Buffer.from(svg)).resize(size, size, { fit: "contain", background: "#fcfaf5" });

  if (padding > 0) {
    const inner = size - padding * 2;
    pipeline = sharp(Buffer.from(svg))
      .resize(inner, inner, { fit: "contain", background: "#fcfaf5" })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: "#fcfaf5"
      });
  }

  await pipeline.png().toFile(output);
  console.log(`Wrote ${filename}`);
}

await writeIcon(512, "icon-512.png");
await writeIcon(512, "icon-512-maskable.png", 64);
await writeIcon(192, "icon-192.png");

console.log(`PWA icons generated in ${iconDir}`);
