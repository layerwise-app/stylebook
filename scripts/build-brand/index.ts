// pnpm build-brand
// Reads the config and source files in brand-files/ and regenerates everything
// in brand-files/generated/: logo colorways, PNGs, tokens, rendered art, the
// manifest, and brand-assets.zip. Deterministic, so unchanged inputs produce
// byte-identical files and the sync has nothing to do.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { zipSync, type Zippable } from 'fflate';
import config from '../../src/brand/brand.config.server';
import type { BrandConfig, BrandFont } from '../../src/brand/types';
import {
  applicationKey,
  contentTypeOf,
  extensionOf,
  FAVICON_180_KEY,
  FAVICON_32_KEY,
  imageryKey,
  logoPngKey,
  logoSvgKey,
  MANIFEST_FILE,
  PNG_SIZES,
  SHARE_IMAGE_KEY,
  SURFACES,
  tokenKey,
  ZIP_KEY,
  type BrandManifest,
  type ManifestFile
} from '../../src/lib/brand-files';
import { normalizeHex } from '../../src/lib/color';
import { assertThemeReadable, requireRoles, resolveTheme } from '../../src/lib/theme';
import { tokensCss, tokensJson, tokensTailwind } from '../../src/lib/tokens';
import { applicationArt, imageryArt, shareArt } from './applications';
import { hashBrandInputs, walkFiles } from './inputs';
import { canvas, Kit, recolorSvg, svgFills, svgSize } from './kit';
import { Typesetter } from './type';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const filesRoot = join(root, 'brand-files');
const generatedRoot = join(filesRoot, 'generated');
const sha256 = (data: Uint8Array | string) => createHash('sha256').update(data).digest('hex');

function validate(brand: BrandConfig) {
  requireRoles(brand.colors);
  assertThemeReadable(resolveTheme(brand.colors));
  const problems: string[] = [];
  for (const color of brand.colors) {
    try {
      normalizeHex(color.hex);
    } catch (error) {
      problems.push((error as Error).message);
    }
    if (!/^[a-z][a-z0-9-]*$/.test(color.id)) {
      problems.push(`Color id "${color.id}" must use lowercase letters, numbers, and dashes.`);
    }
  }
  const fonts = [brand.fonts.display, brand.fonts.text, brand.fonts.mono].filter(Boolean) as BrandFont[];
  const required = [
    ...brand.logos.variants.map((v) => v.file),
    ...fonts.flatMap((f) => [...f.files.map((x) => x.file), ...(f.license.file ? [f.license.file] : [])])
  ];
  for (const file of required) {
    if (!existsSync(join(filesRoot, file))) problems.push(`brand-files/${file} is in the config but missing.`);
  }
  if (!brand.logos.variants.some((v) => v.id === brand.logos.faviconVariant)) {
    problems.push(`logos.faviconVariant "${brand.logos.faviconVariant}" is not one of the logo variants.`);
  }
  if (!brand.changelog.length) problems.push('The changelog needs at least one entry.');
  if (problems.length) {
    throw new Error(`The brand config has problems:\n- ${problems.join('\n- ')}`);
  }
}

function writeGenerated(key: string, data: Uint8Array | string) {
  const path = join(filesRoot, key);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

function renderPng(svg: string, width: number) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false },
    shapeRendering: 2,
    imageRendering: 0
  })
    .render()
    .asPng();
}

async function main() {
  validate(config);
  rmSync(generatedRoot, { recursive: true, force: true });
  mkdirSync(generatedRoot, { recursive: true });

  const sources = Object.fromEntries(
    config.logos.variants.map((v) => [v.id, readFileSync(join(filesRoot, v.file), 'utf8')])
  );
  const logoInfo: BrandManifest['logos'] = {};
  type Meta = Pick<ManifestFile, 'group' | 'zipPath' | 'label' | 'width' | 'height'>;
  const meta = new Map<string, Meta>();

  // Logos: one SVG per colorway, each with its three PNG sizes.
  for (const variant of config.logos.variants) {
    const source = sources[variant.id]!;
    const size = svgSize(source);
    logoInfo[variant.id] = { ...size, fills: svgFills(source) };
    const group = `Logo: ${variant.name}`;
    for (const surface of SURFACES) {
      const way = config.logos.colorways[surface];
      const svg = recolorSvg(source, way.replace);
      const key = logoSvgKey(variant.id, surface);
      writeGenerated(key, svg);
      meta.set(key, { group, zipPath: `logos/svg/${basename(key)}`, label: `${variant.name}, ${way.name.toLowerCase()}`, ...size });
      for (const px of PNG_SIZES) {
        // A size is the logo's longest side.
        const width = size.width >= size.height ? px : Math.round((px * size.width) / size.height);
        const pngKey = logoPngKey(variant.id, surface, px);
        writeGenerated(pngKey, renderPng(svg, width));
        meta.set(pngKey, {
          group,
          zipPath: `logos/png/${basename(pngKey)}`,
          label: `${variant.name}, ${way.name.toLowerCase()}, ${px} px`,
          width,
          height: Math.round((width * size.height) / size.width)
        });
      }
    }
  }

  // Tokens.
  const tokenFiles = [
    [tokenKey('tokens.css'), tokensCss(config), 'CSS variables'],
    [tokenKey('tailwind-theme.css'), tokensTailwind(config), 'Tailwind theme'],
    [tokenKey('tokens.json'), tokensJson(config), 'JSON tokens']
  ] as const;
  for (const [key, text, label] of tokenFiles) {
    writeGenerated(key, text);
    meta.set(key, { group: 'Tokens', zipPath: `tokens/${basename(key)}`, label });
  }

  // Art.
  const type = await Typesetter.load(config, filesRoot);
  const kit = new Kit(config, type, sources);
  for (const art of applicationArt(kit)) {
    const key = applicationKey(art.id);
    writeGenerated(key, renderPng(art.svg, art.width));
    meta.set(key, { group: 'Applications', zipPath: `applications/${basename(key)}`, label: art.title, width: art.width, height: art.height });
  }
  for (const art of imageryArt(kit)) {
    const key = imageryKey(art.id);
    writeGenerated(key, renderPng(art.svg, art.width));
    meta.set(key, { group: 'Imagery', zipPath: `imagery/${basename(key)}`, label: art.title, width: art.width, height: art.height });
  }

  // Web: link preview and favicons.
  writeGenerated(SHARE_IMAGE_KEY, renderPng(shareArt(kit), 1200));
  meta.set(SHARE_IMAGE_KEY, { group: 'Web', zipPath: 'web/share.png', label: 'Link preview image', width: 1200, height: 630 });
  for (const [key, px, label] of [
    [FAVICON_32_KEY, 32, 'Favicon'],
    [FAVICON_180_KEY, 180, 'Apple touch icon']
  ] as const) {
    const aspect = kit.logoAspect(kit.markVariant);
    const box = aspect >= 1 ? { x: 0, y: (100 - 100 / aspect) / 2, width: 100 } : { x: (100 - 100 * aspect) / 2, y: 0, height: 100 };
    const icon = canvas(100, 100, 'none', kit.logo(kit.markVariant, 'light', box));
    writeGenerated(key, renderPng(icon, px));
    meta.set(key, { group: 'Web', zipPath: `web/${basename(key)}`, label, width: px, height: px });
  }

  // Source files: logos, plus fonts only where the license allows handing them out.
  const fontByFile = new Map<string, BrandFont>();
  for (const font of [config.fonts.display, config.fonts.text, config.fonts.mono]) {
    if (!font) continue;
    for (const f of font.files) fontByFile.set(f.file, font);
    if (font.license.file) fontByFile.set(font.license.file, font);
  }
  const sourceKeys = walkFiles(filesRoot)
    .map((path) => relative(filesRoot, path))
    .filter((key) => !key.startsWith('generated/'));
  for (const key of sourceKeys) {
    const variant = config.logos.variants.find((v) => v.file === key);
    const font = fontByFile.get(key);
    if (variant) {
      const { width, height } = logoInfo[variant.id]!;
      meta.set(key, { group: 'Logo source files', zipPath: `logos/source/${basename(key)}`, label: variant.name, width, height });
    } else if (font) {
      const allowed = font.license.allowsDownload;
      const weight = font.files.find((f) => f.file === key)?.weight;
      meta.set(key, {
        group: allowed ? 'Fonts' : null,
        zipPath: allowed ? `fonts/${basename(key)}` : null,
        label: weight ? `${font.family} ${weight}` : `${font.family} license`
      });
    } else {
      meta.set(key, { group: 'Other files', zipPath: `other/${key}`, label: basename(key) });
    }
  }

  // Manifest entries, and the zip built from exactly the listed files.
  const describe = (key: string, data: Uint8Array): ManifestFile => {
    const m = meta.get(key)!;
    return {
      key,
      sha256: sha256(data),
      size: data.length,
      contentType: contentTypeOf(key),
      format: extensionOf(key).toUpperCase(),
      ...m
    };
  };
  const files = [...meta.keys()].sort().map((key) => describe(key, readFileSync(join(filesRoot, key))));
  const zipEntries: Zippable = {};
  for (const file of files) {
    if (!file.zipPath) continue;
    const compressed = !['PNG', 'WOFF2', 'WOFF'].includes(file.format);
    zipEntries[file.zipPath] = [
      new Uint8Array(readFileSync(join(filesRoot, file.key))),
      // A fixed date keeps the zip byte-identical between builds.
      { level: compressed ? 6 : 0, mtime: new Date('2000-01-01T00:00:00Z') }
    ];
  }
  const zip = zipSync(zipEntries);
  writeGenerated(ZIP_KEY, zip);
  meta.set(ZIP_KEY, { group: null, zipPath: null, label: 'All brand assets' });

  const groupOrder = [
    ...config.logos.variants.map((v) => `Logo: ${v.name}`),
    'Logo source files',
    'Fonts',
    'Tokens',
    'Applications',
    'Imagery',
    'Web',
    'Other files'
  ];
  const manifest: BrandManifest = {
    inputHash: hashBrandInputs(root),
    groups: groupOrder.filter((g) => files.some((f) => f.group === g)),
    files: [...files, describe(ZIP_KEY, zip)],
    logos: logoInfo
  };
  writeFileSync(join(filesRoot, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);

  const total = manifest.files.reduce((sum, f) => sum + f.size, 0);
  console.log(
    `Built ${manifest.files.length} files for ${config.name} (${(total / 1024 / 1024).toFixed(1)} MB). ` +
      `brand-assets.zip holds ${Object.keys(zipEntries).length} files, ${(zip.length / 1024 / 1024).toFixed(1)} MB.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
