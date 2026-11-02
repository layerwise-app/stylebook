// pnpm check-leaks (after pnpm build)
// Searches everything a visitor can fetch without passing the gate, meaning the
// client bundle and public files, for brand content. Exits 1 if it finds any.

import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import config from '../src/brand/brand.config.server';
import { formatColor } from '../src/lib/color';
import { walkFiles } from './build-brand/inputs';

const needles = new Map<string, string>();
const add = (label: string, value: string | undefined) => {
  if (value && value.length >= 4) needles.set(value.toLowerCase(), label);
};

add('brand name', config.name);
add('tagline', config.tagline);
add('description', config.description);
add('contact email', config.contactEmail);
add('statement', config.overview.statement);
for (const color of config.colors) {
  const f = formatColor(color.hex);
  add(`color ${color.id}`, f.hex);
  add(`color ${color.id}`, f.rgb);
  add(`color ${color.id}`, f.oklch);
}
for (const font of [config.fonts.display, config.fonts.text, config.fonts.mono]) {
  if (!font) continue;
  add('font name', font.family);
  for (const file of font.files) add('font path', file.file);
}
for (const rule of [...config.voice.principles, ...config.imagery.principles, ...config.overview.pillars]) {
  add('copy', rule.title);
  add('copy', rule.body);
}
add('voice', config.voice.summary);
for (const pair of config.voice.pairs) {
  add('voice', pair.write);
  add('voice', pair.avoid);
  add('voice', pair.why);
}
for (const variant of config.logos.variants) add('logo path', variant.file);
add('path', 'brand-files');
add('path', 'generated/logos');
add('path', 'brand-assets');
add('sync route', '__stylebook');

const roots = ['dist/client', 'public'];
const files = roots.flatMap((root) => walkFiles(root));
if (!files.some((f) => f.startsWith('dist/client'))) {
  console.error('No dist/client found. Run `pnpm build` first.');
  process.exit(1);
}

const textual = /\.(js|mjs|css|html|json|txt|xml|svg|map|webmanifest)$|\/_headers$/;
let found = 0;
for (const file of files) {
  // Binary formats can hide names too, so they are scanned as raw text as well.
  const content = readFileSync(file, textual.test(file) ? 'utf8' : 'latin1').toLowerCase();
  for (const [needle, label] of needles) {
    if (content.includes(needle)) {
      console.error(`LEAK ${relative('.', file)}: ${label}: ${needle}`);
      found++;
    }
  }
}
console.log(`Checked ${files.length} files for ${needles.size} brand strings.`);
if (found) {
  console.error(`${found} leak(s) found.`);
  process.exit(1);
}
console.log('No brand content in client assets or public files.');
