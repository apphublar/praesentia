import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
  console.error("Usage: node scripts/remove-black-background.mjs <input> <output.png>");
  process.exit(1);
}

const threshold = Number(process.env.THRESHOLD ?? 36);
const feather = Number(process.env.FEATHER ?? 24);

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const brightness = Math.max(r, g, b);

  if (brightness <= threshold) {
    data[i + 3] = 0;
    continue;
  }

  if (brightness <= threshold + feather) {
    data[i + 3] = Math.round(((brightness - threshold) / feather) * 255);
  }
}

mkdirSync(dirname(output), { recursive: true });

await sharp(data, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4
  }
})
  .png()
  .toFile(output);

console.log(`Wrote transparent PNG to ${output}`);
