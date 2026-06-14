import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "marketing", "hero");

const photos = [
  {
    file: "birthday.jpg",
    url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&h=900&q=85"
  },
  {
    file: "wedding-dance.jpg",
    url: "https://images.unsplash.com/photo-1519741497674-611481963552?auto=format&fit=crop&w=900&h=900&q=85"
  },
  {
    file: "dinner.jpg",
    url: "https://images.unsplash.com/photo-1528607929212-506042344741?auto=format&fit=crop&w=900&h=900&q=85"
  },
  {
    file: "family-hug.jpg",
    url: "https://images.unsplash.com/photo-1515488042361-ee00e8176643?auto=format&fit=crop&w=900&h=900&q=85"
  }
];

mkdirSync(outDir, { recursive: true });

for (const photo of photos) {
  const response = await fetch(photo.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${photo.url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const output = join(outDir, photo.file);

  await sharp(buffer).rotate().resize(720, 720, { fit: "cover", position: "centre" }).jpeg({ quality: 86, mozjpeg: true }).toFile(output);

  console.log(`Saved ${photo.file}`);
}

console.log(`Hero photos ready in ${outDir}`);
