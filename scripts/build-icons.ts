// pnpm build-icons
// Renders public/logo.svg, the Stylebook template's own logo, to public/logo.png and
// every favicon. These are the template's files and hold no brand content: a brand's
// favicon comes from `pnpm build-brand` and is served through the access check.

import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const publicRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const svg = readFileSync(join(publicRoot, 'logo.svg'), 'utf8');
const render = (size: number) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

const files: [string, number][] = [
  ['logo.png', 1024],
  ['favicon.png', 32],
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512]
];
for (const [name, size] of files) writeFileSync(join(publicRoot, name), render(size));
copyFileSync(join(publicRoot, 'logo.svg'), join(publicRoot, 'favicon.svg'));

// An ICO is a small directory followed by the images; every current browser
// accepts PNG data inside it.
const icoSizes = [16, 32, 48];
const images = icoSizes.map(render);
const header = Buffer.alloc(6 + icoSizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((size, i) => {
  const entry = 6 + i * 16;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i]!.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i]!.length;
});
writeFileSync(join(publicRoot, 'favicon.ico'), Buffer.concat([header, ...images]));

console.log(`Rendered ${files.length} PNGs, favicon.ico, and favicon.svg from public/logo.svg.`);
