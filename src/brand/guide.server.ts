// Turns the config and manifest into what the pages render. Everything computed
// (color formats, contrast, tokens, theme) comes straight from the config, so
// changing the config changes the site.

import {
  applicationKey,
  FAVICON_180_KEY,
  FAVICON_32_KEY,
  imageryKey,
  logoPngKey,
  logoSvgKey,
  PNG_SIZES,
  SHARE_IMAGE_KEY,
  SURFACES,
  tokenKey,
  ZIP_KEY
} from '~/lib/brand-files';
import {
  contrastRatio,
  formatColor,
  formatRatio,
  normalizeHex,
  readableOn,
  rotateHue,
  softestReadable,
  wcagLevel,
  type WcagLevel
} from '~/lib/color';
import { PAGES } from '~/lib/pages';
import { fontFaceCss, fontStack, resolveTheme, themeCss } from '~/lib/theme';
import { tokensCss, tokensJson, tokensTailwind } from '~/lib/tokens';
import config from './brand.config.server';
import { manifest, manifestFile } from './manifest.server';
import type { BrandFont } from './types';
import type { FileView, FontView, GuideView, ImageView, SearchItem, WcagLabel } from './view';

export const fileUrl = (key: string) => `/files/${key.split('/').map(encodeURIComponent).join('/')}`;
export const downloadUrl = (key: string) => `${fileUrl(key)}?download=1`;

function readableSize(bytes: number) {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000 * 1000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / 1000 / 1000).toFixed(1)} MB`;
}

const sizeOf = (key: string) => readableSize(manifestFile(key)?.size ?? 0);

function fileView(key: string): FileView {
  const file = manifestFile(key);
  if (!file) throw new Error(`${key} is not in the manifest. Run pnpm build-brand.`);
  return {
    key,
    label: file.label,
    format: file.format,
    size: readableSize(file.size),
    href: downloadUrl(key),
    zipPath: file.zipPath
  };
}

const wcagLabels: Record<WcagLevel, WcagLabel> = {
  AAA: 'Pass AAA',
  AA: 'Pass AA',
  'AA Large': 'Large only',
  Fail: 'Fail'
};

function longDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${iso}T00:00:00Z`));
}

function imageView(
  id: string,
  key: string,
  copy: { title: string; caption: string; alt: string }
): ImageView {
  const file = manifestFile(key);
  return {
    id,
    src: fileUrl(key),
    width: file?.width ?? 1600,
    height: file?.height ?? 1000,
    ...copy
  };
}

function fontView(role: FontView['role'], roleLabel: string, font: BrandFont): FontView {
  const allowed = font.license.allowsDownload;
  return {
    role,
    roleLabel,
    family: font.family,
    stack: fontStack(font),
    specimenWeight: font.specimenWeight,
    usage: font.usage,
    licenseName: font.license.name,
    allowsDownload: allowed,
    weights: font.files.map((f) => ({
      weight: f.weight,
      href: allowed ? downloadUrl(f.file) : null,
      size: allowed ? sizeOf(f.file) : null
    })),
    licenseHref: allowed && font.license.file ? downloadUrl(font.license.file) : null
  };
}

function buildSearch(): SearchItem[] {
  const sections = PAGES.flatMap((page): SearchItem[] => [
    {
      kind: 'section',
      title: page.title,
      detail: 'Page',
      to: page.path,
      keywords: page.sections.map((s) => s.title)
    },
    ...page.sections.map(
      (section): SearchItem => ({
        kind: 'section',
        title: section.title,
        detail: page.title,
        to: page.path,
        hash: section.id,
        keywords: [page.title]
      })
    )
  ]);
  const colors = config.colors.map((color): SearchItem => {
    const formats = formatColor(color.hex);
    return {
      kind: 'color',
      title: color.name,
      detail: formats.hex,
      to: '/color',
      hash: `color-${color.id}`,
      swatch: formats.hex,
      keywords: [formats.hex, formats.rgb, formats.hsl, formats.oklch, color.role, color.usage]
    };
  });
  return [
    ...sections,
    ...colors,
    {
      kind: 'section',
      title: 'One-page sheet',
      detail: 'Print',
      to: '/sheet',
      keywords: ['summary', 'pdf', 'print']
    }
  ];
}

function buildGuide(): Omit<GuideView, 'protected' | 'syncErrors'> {
  if (config.logos.variants.some((variant) => !manifest.logos[variant.id])) {
    throw new Error('brand-files/generated/ does not match the brand config. Run `pnpm build-brand`.');
  }
  const theme = resolveTheme(config.colors);
  const ink = theme.ink.background;
  const paper = theme.paper.background;
  const latest = config.changelog[0]!;
  const primary = config.logos.variants[0]!;
  const primaryInfo = manifest.logos[primary.id]!;

  const swatches = config.colors.map((color) => {
    const hex = normalizeHex(color.hex);
    const formats = formatColor(hex);
    const on = readableOn(hex, ink, ink, paper);
    return {
      id: color.id,
      name: color.name,
      hex,
      role: color.role,
      usage: color.usage,
      proportion: color.proportion,
      on,
      muted: softestReadable(on, hex),
      values: [
        { label: 'HEX', value: formats.hex },
        { label: 'RGB', value: formats.rgb },
        { label: 'HSL', value: formats.hsl },
        { label: 'OKLCH', value: formats.oklch },
        ...(color.cmyk ? [{ label: 'CMYK', value: color.cmyk }] : []),
        ...(color.pantone ? [{ label: 'Pantone', value: color.pantone }] : [])
      ]
    };
  });

  const contrast = swatches.map((foreground) =>
    swatches.map((background) => {
      const ratio = contrastRatio(foreground.hex, background.hex);
      const level = wcagLevel(ratio);
      return {
        ratio: formatRatio(ratio),
        label: wcagLabels[level],
        passes: level === 'AAA' || level === 'AA',
        note: readableOn(background.hex, ink, ink, paper)
      };
    })
  );

  const surfaceColors = {
    light: { background: theme.paper.background, text: theme.paper.text },
    dark: { background: theme.ink.background, text: theme.ink.text },
    brand: { background: theme.brand.background, text: theme.brand.text }
  };

  const variants = config.logos.variants.map((variant) => {
    const info = manifest.logos[variant.id]!;
    return {
      id: variant.id,
      name: variant.name,
      use: variant.use,
      width: info.width,
      height: info.height,
      clearSpace: variant.clearSpace,
      minWidthPx: variant.minWidthPx,
      minWidthMm: variant.minWidthMm,
      sourceSvg: downloadUrl(variant.file),
      surfaces: SURFACES.map((surface) => ({
        id: surface,
        name: config.logos.colorways[surface].name,
        ...surfaceColors[surface],
        svg: fileUrl(logoSvgKey(variant.id, surface)),
        svgDownload: downloadUrl(logoSvgKey(variant.id, surface)),
        pngs: PNG_SIZES.map((size) => ({
          size,
          href: downloadUrl(logoPngKey(variant.id, surface, size))
        }))
      }))
    };
  });

  // The hardest palette color to see the logo on, for the misuse example.
  const logoFills = primaryInfo.fills;
  const lowContrastBackground = [...swatches]
    .map((swatch) => ({
      hex: swatch.hex,
      average:
        logoFills.reduce((sum, fill) => sum + contrastRatio(fill, swatch.hex), 0) /
        Math.max(logoFills.length, 1)
    }))
    .sort((a, b) => a.average - b.average)[0]!.hex;

  const fonts: FontView[] = [
    fontView('display', 'Display', config.fonts.display),
    fontView('text', 'Text', config.fonts.text),
    ...(config.fonts.mono ? [fontView('mono', 'Measure', config.fonts.mono)] : [])
  ];
  const fontFor = (role: 'display' | 'text' | 'mono') =>
    config.fonts[role] ?? config.fonts.text;

  const apps = config.applications;
  const applicationTitle = (id: string) =>
    PAGES.find((p) => p.path === '/applications')!.sections.find((s) => s.id === id)!.title;
  const applications = (
    [
      ['social-post', apps.socialPost],
      ['packaging', apps.packaging],
      ['slide', apps.slide],
      ['business-card', apps.businessCard],
      ['poster', apps.poster]
    ] as const
  ).map(([id, copy]) =>
    imageView(id, applicationKey(id), {
      title: applicationTitle(id),
      caption: copy.caption,
      alt: copy.alt
    })
  );

  const tokenFormats = [
    { id: 'css' as const, label: 'CSS variables', file: 'tokens.css' as const, code: tokensCss(config) },
    { id: 'tailwind' as const, label: 'Tailwind theme', file: 'tailwind-theme.css' as const, code: tokensTailwind(config) },
    { id: 'json' as const, label: 'JSON', file: 'tokens.json' as const, code: tokensJson(config) }
  ].map(({ id, label, file, code }) => ({
    id,
    label,
    fileName: file,
    code,
    href: downloadUrl(tokenKey(file)),
    size: sizeOf(tokenKey(file))
  }));

  const groups = manifest.groups.map((name) => ({
    name,
    files: manifest.files
      .filter((f) => f.group === name)
      // Natural order, so 512 px comes before 1024 px.
      .sort((a, b) => a.label.localeCompare(b.label, 'en', { numeric: true }))
      .map((f) => fileView(f.key))
  }));

  const n = config.name;
  const pages: GuideView['pages'] = {
    '/': { lead: config.tagline, description: config.description },
    '/logo': {
      lead: config.logos.intro,
      description: `${n} logo guidelines: every variant on light, dark, and brand backgrounds, clear space, minimum size, and misuse.`
    },
    '/color': {
      lead: config.colorIntro,
      description: `${n} color palette with HEX, RGB, HSL, and OKLCH values to copy, plus a WCAG contrast grid of every pair.`
    },
    '/typography': {
      lead: config.typeIntro,
      description: `${n} typefaces, live specimens, the type scale, and which style to use for each role.`
    },
    '/imagery': {
      lead: config.imagery.summary,
      description: `${n} art direction: the rules for images, with finished examples.`
    },
    '/voice': {
      lead: config.voice.summary,
      description: `${n} voice: writing principles and specific pairs of what to write and what to avoid.`
    },
    '/applications': {
      lead: 'The brand at work: finished pieces built only from what this guide specifies.',
      description: `${n} in use: a social post, packaging, a slide, a business card, and a poster.`
    },
    '/tokens': {
      lead: 'Generated from the brand config each time, so these values can’t go stale.',
      description: `${n} design tokens as CSS variables, a Tailwind theme, and JSON, generated from the brand config.`
    },
    '/downloads': {
      lead: 'Every file in one place, or all of them in a single zip.',
      description: `Download ${n} logos, fonts, tokens, and images, grouped, with file sizes and formats.`
    },
    '/changelog': {
      lead: 'What changed in these guidelines, and when.',
      description: `Version history of the ${n} brand guidelines.`
    },
    '/sheet': {
      lead: 'The brand on one page.',
      description: `A one-page ${n} brand summary with logo, colors, and fonts, ready to print on A4 or Letter.`
    }
  };

  return {
    name: n,
    tagline: config.tagline,
    description: config.description,
    contactEmail: config.contactEmail,
    version: latest.version,
    updated: longDate(latest.date),
    themeCss: `${fontFaceCss(config)}\n${themeCss(config)}`,
    fontPreloads: [
      config.fonts.display.files.find((f) => f.weight === config.fonts.display.specimenWeight) ??
        config.fonts.display.files[0]!,
      config.fonts.text.files.find((f) => f.weight === 400) ?? config.fonts.text.files[0]!
    ]
      .filter((f) => f.file.endsWith('.woff2'))
      .map((f) => fileUrl(f.file)),
    favicon: fileUrl(FAVICON_32_KEY),
    appleTouchIcon: fileUrl(FAVICON_180_KEY),
    shareImage: fileUrl(SHARE_IMAGE_KEY),
    coverMark: fileUrl(logoSvgKey(config.logos.faviconVariant, 'brand')),
    themeColor: theme.brand.background,
    darkPaper:
      contrastRatio(theme.paper.background, '#FFFFFF') >
      contrastRatio(theme.paper.background, '#000000'),
    primaryLogo: {
      light: fileUrl(logoSvgKey(primary.id, 'light')),
      dark: fileUrl(logoSvgKey(primary.id, 'dark')),
      brand: fileUrl(logoSvgKey(primary.id, 'brand')),
      width: primaryInfo.width,
      height: primaryInfo.height,
      alt: n
    },
    pages,
    search: buildSearch(),
    overview: {
      statement: config.overview.statement,
      pillars: config.overview.pillars,
      quickDownloads: [
        {
          title: 'Everything',
          detail: `brand-assets.zip, ${sizeOf(ZIP_KEY)}`,
          href: downloadUrl(ZIP_KEY)
        },
        {
          title: primary.name,
          detail: `SVG, ${sizeOf(logoSvgKey(primary.id, 'light'))}`,
          href: downloadUrl(logoSvgKey(primary.id, 'light'))
        },
        {
          title: 'CSS tokens',
          detail: `tokens.css, ${sizeOf(tokenKey('tokens.css'))}`,
          href: downloadUrl(tokenKey('tokens.css'))
        }
      ]
    },
    logo: {
      variants,
      misuse: {
        wrongColor: rotateHue(theme.brand.background, 150),
        lowContrastBackground
      }
    },
    color: { swatches, contrast },
    type: {
      testLine: config.testLine,
      fonts,
      scale: config.typeScale.map((step) => ({
        id: step.id,
        name: step.name,
        fontFamily: fontFor(step.font).family,
        stack: step.font === 'mono' ? fontStack(config.fonts.mono) : fontStack(fontFor(step.font)),
        weight: step.weight,
        sizePx: step.sizePx,
        lineHeight: step.lineHeight,
        tracking: step.tracking,
        uppercase: step.uppercase ?? false,
        usage: step.usage
      }))
    },
    imagery: {
      principles: config.imagery.principles,
      examples: config.imagery.examples.map((example) =>
        imageView(example.id, imageryKey(example.id), {
          title: example.title,
          caption: example.caption,
          alt: example.alt
        })
      )
    },
    voice: { principles: config.voice.principles, pairs: config.voice.pairs },
    applications,
    tokens: { formats: tokenFormats, spacing: config.spacing },
    downloads: {
      zip: fileView(ZIP_KEY),
      fileCount: groups.reduce((sum, g) => sum + g.files.length, 0),
      groups
    },
    changelog: config.changelog.map((entry) => ({
      version: entry.version,
      date: entry.date,
      dateLabel: longDate(entry.date),
      changes: entry.changes
    }))
  };
}

const guide = buildGuide();

export function getGuideView(isProtected: boolean, syncErrors: string[] | null): GuideView {
  return { ...guide, protected: isProtected, syncErrors };
}
