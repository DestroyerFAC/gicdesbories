// Génère les icônes PNG à partir de public/favicon.svg.
// Usage : npm run icons
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const svg = await readFile(`${publicDir}favicon.svg`);

const targets = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-512.png', size: 512 },
];

for (const { file, size } of targets) {
  await sharp(svg, { density: Math.ceil((72 * size) / 48) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(`${publicDir}${file}`);
  console.log(`✓ ${file} (${size}×${size})`);
}
