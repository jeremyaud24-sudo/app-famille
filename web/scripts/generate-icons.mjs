import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, "icon.svg");
const outDir = path.join(__dirname, "..", "public", "icons");

const sizes = [180, 192, 512];

for (const size of sizes) {
  const outPath = path.join(outDir, `icon-${size}.png`);
  await sharp(svgPath).resize(size, size).png().toFile(outPath);
  console.log(`Écrit ${outPath}`);
}
