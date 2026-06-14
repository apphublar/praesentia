import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = "C:/Users/ADM/.cursor/projects/c-Users-ADM-Documents-PRAESENTIA/assets";
const outDir = join(root, "public", "marketing", "sections");

mkdirSync(outDir, { recursive: true });

const jobs = [
  { src: "mavie-mural-collage.png", dest: "mavie-mural-collage.jpg", width: 960, height: 600, fit: "cover" },
  { src: "mavie-capsule-collage.png", dest: "mavie-capsule-collage.jpg", width: 960, height: 600, fit: "cover" },
  { src: "mavie-invite-preview.png", dest: "mavie-invite-preview.jpg", width: 720, height: 900, fit: "cover" },
  { src: "featured-wedding.jpg", dest: "featured-wedding.jpg", width: 720, height: 720, fit: "cover" },
  { src: "featured-graduation.jpg", dest: "featured-graduation.jpg", width: 720, height: 720, fit: "cover" },
  { src: "featured-mavie.jpg", dest: "featured-mavie.jpg", width: 720, height: 720, fit: "cover" },
  { src: "featured-reveillon.jpg", dest: "featured-reveillon.jpg", width: 720, height: 720, fit: "cover" },
  { src: "mavie-cha.jpg", dest: "mavie-cha.jpg", width: 480, height: 480, fit: "cover" },
  { src: "mavie-garden-2.jpg", dest: "mavie-garden-2.jpg", width: 480, height: 480, fit: "cover" },
  { src: "mavie-school.jpg", dest: "mavie-school.jpg", width: 480, height: 480, fit: "cover" },
  { src: "mavie-7years.jpg", dest: "mavie-7years.jpg", width: 480, height: 480, fit: "cover" },
  { src: "mavie-favorite.jpg", dest: "mavie-favorite.jpg", width: 480, height: 480, fit: "cover" }
];

for (const job of jobs) {
  const input = join(assets, job.src);
  const output = join(outDir, job.dest);
  await sharp(input)
    .rotate()
    .resize(job.width, job.height, { fit: job.fit, position: "centre" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(output);
  console.log(`Saved ${job.dest}`);
}

console.log(`Marketing section images ready in ${outDir}`);
