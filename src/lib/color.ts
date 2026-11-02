// Color math for the guide, the theme, and the tokens. No dependencies and no
// brand values, so the same code runs in build-brand, the server, and tests.

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };
export type Oklch = { l: number; c: number; h: number };

const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  // Avoids "-0" and binary float noise in values that get copied.
  return Math.round(value * factor) / factor + 0;
};

/** Normalizes `#abc`, `abc`, or `#AABBCC` to uppercase `#AABBCC`. */
export function normalizeHex(input: string): string {
  const raw = input.trim().replace(/^#/, '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`"${input}" is not a hex color like #1A2B3C`);
  }
  return `#${full.toUpperCase()}`;
}

export function hexToRgb(input: string): Rgb {
  const hex = normalizeHex(input).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const part = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l: l * 100 };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

const toLinear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (c: number) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v)) * 255;
};

/** OKLab with L in 0..1, using Björn Ottosson's published matrices. */
export function rgbToOklab({ r, g, b }: Rgb) {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  };
}

export function oklabToRgb(lab: { L: number; a: number; b: number }): Rgb {
  const l = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s = lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b;
  const [l3, m3, s3] = [l ** 3, m ** 3, s ** 3];
  return {
    r: fromLinear(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: fromLinear(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: fromLinear(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3)
  };
}

export function rgbToOklch(rgb: Rgb): Oklch {
  const { L, a, b } = rgbToOklab(rgb);
  const c = Math.hypot(a, b);
  // Neutrals have no meaningful hue.
  if (c < 0.00004) return { l: L, c: 0, h: 0 };
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

/** The four copyable formats, in the exact text a designer pastes. */
export function formatColor(hex: string) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const lch = rgbToOklch(rgb);
  return {
    hex: normalizeHex(hex),
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl: `hsl(${round(hsl.h)}, ${round(hsl.s)}%, ${round(hsl.l)}%)`,
    oklch: `oklch(${round(lch.l, 3)} ${round(lch.c, 3)} ${round(lch.h, 1)})`
  };
}

/** WCAG 2 relative luminance. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2 contrast ratio, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail';

/**
 * Rates a ratio without rounding it first, so 4.499 is a fail even though it
 * displays as 4.50.
 */
export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

/** Shows two decimals, rounding down so a failing pair can't read as passing. */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 100) / 100).toFixed(2);
}

/** Perceptual distance in OKLab. */
export function colorDistance(a: string, b: string): number {
  const x = rgbToOklab(hexToRgb(a));
  const y = rgbToOklab(hexToRgb(b));
  return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);
}

/** Mixes in OKLab. `amount` 0 returns `a`, 1 returns `b`. */
export function mixColors(a: string, b: string, amount: number): string {
  const x = rgbToOklab(hexToRgb(a));
  const y = rgbToOklab(hexToRgb(b));
  return rgbToHex(
    oklabToRgb({
      L: x.L + (y.L - x.L) * amount,
      a: x.a + (y.a - x.a) * amount,
      b: x.b + (y.b - x.b) * amount
    })
  );
}

/** Same lightness and chroma, rotated hue. Used for "wrong color" examples. */
export function rotateHue(hex: string, degrees: number): string {
  const lab = rgbToOklab(hexToRgb(hex));
  const radians = (degrees * Math.PI) / 180;
  return rgbToHex(
    oklabToRgb({
      L: lab.L,
      a: lab.a * Math.cos(radians) - lab.b * Math.sin(radians),
      b: lab.a * Math.sin(radians) + lab.b * Math.cos(radians)
    })
  );
}

export const BODY_TEXT_RATIO = 4.5;

/**
 * Picks a text color for `background`: `preferred` when it meets 4.5:1,
 * otherwise whichever of `ink` or `paper` passes and sits nearest to it. Black
 * or white is the last resort for mid-tone backgrounds where neither passes;
 * one of the two always does.
 */
export function readableOn(
  background: string,
  preferred: string,
  ink: string,
  paper: string
): string {
  if (contrastRatio(preferred, background) >= BODY_TEXT_RATIO) {
    return normalizeHex(preferred);
  }
  const passing = [ink, paper]
    .filter((c) => contrastRatio(c, background) >= BODY_TEXT_RATIO)
    .sort((x, y) => colorDistance(x, preferred) - colorDistance(y, preferred));
  if (passing[0]) return normalizeHex(passing[0]);
  return contrastRatio('#000000', background) >=
    contrastRatio('#FFFFFF', background)
    ? '#000000'
    : '#FFFFFF';
}

/**
 * Softens `text` toward `background` as far as possible while staying at or
 * above `ratio`. Returns `text` itself when there is no room to soften.
 */
export function softestReadable(
  text: string,
  background: string,
  ratio = BODY_TEXT_RATIO,
  maxAmount = 0.6
): string {
  let low = 0;
  let high = maxAmount;
  let best = normalizeHex(text);
  for (let i = 0; i < 12; i++) {
    const middle = (low + high) / 2;
    const candidate = mixColors(text, background, middle);
    if (contrastRatio(candidate, background) >= ratio) {
      best = candidate;
      low = middle;
    } else {
      high = middle;
    }
  }
  return best;
}
