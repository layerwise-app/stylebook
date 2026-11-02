// Turns the brand's colors, fonts, type scale, and spacing into the CSS
// variables the whole site is styled with. Every text/background pair is
// resolved here so body text holds 4.5:1 whatever the brand's colors are.

import type {
  BrandColor,
  BrandConfig,
  BrandFont,
  TypeRole,
  TypeStep
} from '../brand/types';
import {
  contrastRatio,
  mixColors,
  normalizeHex,
  readableOn,
  softestReadable
} from './color';

export type Surface = { background: string; text: string; muted: string };

export type Theme = {
  paper: Surface;
  ink: Surface;
  brand: Surface;
  accent: Surface;
  tint: Surface;
  /** Link and emphasis color on paper. */
  link: string;
  /** Hairlines on paper. Not text, so it isn't held to 4.5:1. */
  rule: string;
};

function colorByRole(colors: BrandColor[], role: BrandColor['role']) {
  return colors.find((c) => c.role === role);
}

export function requireRoles(colors: BrandColor[]) {
  const ink = colorByRole(colors, 'ink');
  const paper = colorByRole(colors, 'paper');
  const brand = colorByRole(colors, 'brand');
  if (!ink || !paper || !brand) {
    throw new Error(
      'The config needs one color each with role "ink", "paper", and "brand".'
    );
  }
  return { ink, paper, brand };
}

export function resolveTheme(colors: BrandColor[]): Theme {
  const roles = requireRoles(colors);
  const ink = normalizeHex(roles.ink.hex);
  const paper = normalizeHex(roles.paper.hex);
  const brand = normalizeHex(roles.brand.hex);
  const accent = normalizeHex(colorByRole(colors, 'accent')?.hex ?? brand);

  const surface = (background: string, preferred: string): Surface => {
    const text = readableOn(background, preferred, ink, paper);
    return { background, text, muted: softestReadable(text, background) };
  };

  // Ink and paper may not contrast well with each other in a loose brand, so
  // even the base pair goes through the same rule.
  const onPaper = surface(paper, ink);
  const tint = mixColors(paper, onPaper.text, 0.07);

  return {
    paper: onPaper,
    ink: surface(ink, paper),
    brand: surface(brand, ink),
    accent: surface(accent, ink),
    tint: surface(tint, onPaper.text),
    link: readableOn(paper, brand, ink, paper),
    rule: mixColors(paper, onPaper.text, 0.28)
  };
}

const defaultSteps: Record<TypeRole, Omit<TypeStep, 'id' | 'name' | 'usage'>> = {
  display: { font: 'display', weight: 400, sizePx: 112, lineHeight: 1, tracking: -0.02 },
  h1: { font: 'display', weight: 400, sizePx: 64, lineHeight: 1.05, tracking: -0.015 },
  h2: { font: 'display', weight: 400, sizePx: 36, lineHeight: 1.15, tracking: -0.01 },
  h3: { font: 'text', weight: 600, sizePx: 22, lineHeight: 1.3, tracking: 0 },
  body: { font: 'text', weight: 400, sizePx: 17, lineHeight: 1.55, tracking: 0 },
  small: { font: 'text', weight: 400, sizePx: 14, lineHeight: 1.45, tracking: 0 },
  label: { font: 'text', weight: 600, sizePx: 12, lineHeight: 1.3, tracking: 0.06 }
};

/** Screen sizes never fall below this share of the config's size. */
const floorShare: Record<TypeRole, number> = {
  display: 0.4,
  h1: 0.55,
  h2: 0.72,
  h3: 0.85,
  body: 1,
  small: 1,
  label: 1
};

const fallbacks: Record<BrandFont['fallback'], string> = {
  serif: 'Georgia, "Times New Roman", serif',
  'sans-serif': 'system-ui, -apple-system, "Segoe UI", sans-serif',
  monospace: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
};

/** A missing font only happens for the optional mono role. */
export function fontStack(font: BrandFont | undefined) {
  if (!font) return fallbacks.monospace;
  return `"${font.family.replaceAll('"', '')}", ${fallbacks[font.fallback]}`;
}

export function fontFaceCss(config: Pick<BrandConfig, 'fonts'>): string {
  const fonts = [config.fonts.display, config.fonts.text, config.fonts.mono];
  return fonts
    .flatMap((font) =>
      (font?.files ?? []).map((file) => {
        const format = file.file.endsWith('.woff2')
          ? 'woff2'
          : file.file.endsWith('.woff')
            ? 'woff'
            : file.file.endsWith('.otf')
              ? 'opentype'
              : 'truetype';
        return (
          `@font-face{font-family:"${font!.family.replaceAll('"', '')}";` +
          `font-style:${file.style ?? 'normal'};font-weight:${file.weight};` +
          `font-display:swap;src:url("/files/${encodeURI(file.file)}") format("${format}")}`
        );
      })
    )
    .join('\n');
}

/** Spacing steps the layout asks for, resolved to the brand's nearest step. */
const layoutSpacing = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];

export function themeCss(
  config: Pick<BrandConfig, 'colors' | 'fonts' | 'typeScale' | 'spacing'>
): string {
  const theme = resolveTheme(config.colors);
  const vars: Record<string, string> = {
    '--sb-paper': theme.paper.background,
    '--sb-text': theme.paper.text,
    '--sb-muted': theme.paper.muted,
    '--sb-link': theme.link,
    '--sb-rule': theme.rule,
    '--sb-tint': theme.tint.background,
    '--sb-on-tint': theme.tint.text,
    '--sb-muted-on-tint': theme.tint.muted,
    '--sb-ink': theme.ink.background,
    '--sb-on-ink': theme.ink.text,
    '--sb-muted-on-ink': theme.ink.muted,
    '--sb-brand': theme.brand.background,
    '--sb-on-brand': theme.brand.text,
    '--sb-muted-on-brand': theme.brand.muted,
    '--sb-accent': theme.accent.background,
    '--sb-on-accent': theme.accent.text,
    '--sb-muted-on-accent': theme.accent.muted,
    '--sb-font-display': fontStack(config.fonts.display),
    '--sb-font-text': fontStack(config.fonts.text),
    '--sb-font-mono': fontStack(config.fonts.mono)
  };

  const stacks: Record<TypeStep['font'], string> = {
    display: 'var(--sb-font-display)',
    text: 'var(--sb-font-text)',
    mono: 'var(--sb-font-mono)'
  };
  for (const role of Object.keys(defaultSteps) as TypeRole[]) {
    const step = config.typeScale.find((s) => s.id === role);
    const value = step ?? defaultSteps[role];
    const floor = Math.round(value.sizePx * floorShare[role]);
    vars[`--sb-${role}-font`] = stacks[value.font];
    vars[`--sb-${role}-weight`] = String(value.weight);
    vars[`--sb-${role}-leading`] = String(value.lineHeight);
    vars[`--sb-${role}-tracking`] = `${value.tracking}em`;
    vars[`--sb-${role}-case`] =
      step?.uppercase || (!step && role === 'label') ? 'uppercase' : 'none';
    vars[`--sb-${role}-max`] = `${value.sizePx}px`;
    vars[`--sb-${role}-min`] = `${floor}px`;
  }

  const brandSteps = [...config.spacing].map((s) => s.px).sort((a, b) => a - b);
  layoutSpacing.forEach((target, index) => {
    const nearest = brandSteps.length
      ? brandSteps.reduce((best, px) =>
          Math.abs(px - target) < Math.abs(best - target) ? px : best
        )
      : target;
    vars[`--sb-space-${index + 1}`] = `${nearest}px`;
  });

  const body = Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(';');
  return `:root{${body}}`;
}

/** Fails loudly in build-brand if the rule above ever stops holding. */
export function assertThemeReadable(theme: Theme) {
  const pairs: [string, Surface][] = [
    ['paper', theme.paper],
    ['ink', theme.ink],
    ['brand', theme.brand],
    ['accent', theme.accent],
    ['tint', theme.tint]
  ];
  for (const [name, surface] of pairs) {
    for (const text of [surface.text, surface.muted]) {
      const ratio = contrastRatio(text, surface.background);
      if (ratio < 4.5) {
        throw new Error(`Theme text on ${name} is only ${ratio.toFixed(2)}:1`);
      }
    }
  }
}
