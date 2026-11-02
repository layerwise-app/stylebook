// What the art templates draw with: the palette, the logos, and the type.

import type { BrandConfig } from '../../src/brand/types';
import { contrastRatio, normalizeHex, readableOn } from '../../src/lib/color';
import { resolveTheme } from '../../src/lib/theme';
import { SURFACES, type Surface } from '../../src/lib/brand-files';
import type { Typesetter } from './type';

export const HEX_PATTERN = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

export function recolorSvg(svg: string, replace: Record<string, string>) {
  const map = new Map(
    Object.entries(replace).map(([from, to]) => [normalizeHex(from), normalizeHex(to)])
  );
  return svg.replace(HEX_PATTERN, (hex) => map.get(normalizeHex(hex)) ?? hex);
}

export function svgSize(svg: string) {
  const box = svg.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/);
  if (box) return { width: Number(box[1]), height: Number(box[2]) };
  const w = svg.match(/<svg[^>]*\swidth="([\d.]+)/);
  const h = svg.match(/<svg[^>]*\sheight="([\d.]+)/);
  if (w && h) return { width: Number(w[1]), height: Number(h[1]) };
  throw new Error('A logo SVG needs a viewBox or width and height.');
}

export function svgFills(svg: string) {
  return [...new Set((svg.match(HEX_PATTERN) ?? []).map(normalizeHex))];
}

const innerSvg = (svg: string) =>
  svg
    .replace(/<\?xml[\s\S]*?\?>/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');

export type Box = { x: number; y: number; width?: number; height?: number };

export class Kit {
  readonly theme;
  readonly ink: string;
  readonly paper: string;
  readonly brand: string;
  private byId: Map<string, string>;

  constructor(
    readonly config: BrandConfig,
    readonly type: Typesetter,
    private logoSources: Record<string, string>
  ) {
    this.theme = resolveTheme(config.colors);
    this.byId = new Map(config.colors.map((c) => [c.id, normalizeHex(c.hex)]));
    this.ink = this.theme.ink.background;
    this.paper = this.theme.paper.background;
    this.brand = this.theme.brand.background;
  }

  color(id: string) {
    const hex = this.byId.get(id);
    if (!hex) throw new Error(`Unknown color id "${id}" in the config.`);
    return hex;
  }

  /** Text color for a field, with the same fallback rule as the site. */
  textOn(background: string, preferred = this.ink) {
    return readableOn(background, preferred, this.ink, this.paper);
  }

  logoMarkup(variant: string, surface: Surface) {
    const source = this.logoSources[variant];
    if (!source) throw new Error(`Unknown logo variant "${variant}".`);
    return recolorSvg(source, this.config.logos.colorways[surface].replace);
  }

  /** The colorway whose every fill stands out most on this background. */
  bestSurface(variant: string, background: string): Surface {
    const score = (surface: Surface) =>
      Math.min(
        ...svgFills(this.logoMarkup(variant, surface)).map((f) =>
          contrastRatio(f, background)
        )
      );
    return SURFACES.reduce((best, s) => (score(s) > score(best) ? s : best));
  }

  /** Places a logo inside a box, keeping its proportions. */
  logo(variant: string, surface: Surface, box: Box) {
    return this.placeSvg(this.logoMarkup(variant, surface), box);
  }

  /** Places a logo with its fills replaced in order: the first, then the rest. */
  logoTinted(variant: string, first: string, rest: string, box: Box) {
    const source = this.logoSources[variant]!;
    const fills = svgFills(source);
    const replace = Object.fromEntries(
      fills.map((fill, i) => [fill, i === 0 ? first : rest])
    );
    return this.placeSvg(recolorSvg(source, replace), box);
  }

  logoAspect(variant: string) {
    const { width, height } = svgSize(this.logoSources[variant]!);
    return width / height;
  }

  /** The mark to use in art: the favicon variant from the config. */
  get markVariant() {
    return this.config.logos.faviconVariant;
  }

  private placeSvg(svg: string, box: Box) {
    const { width, height } = svgSize(svg);
    const aspect = width / height;
    const w = box.width ?? (box.height ?? height) * aspect;
    const h = box.height ?? w / aspect;
    const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? `0 0 ${width} ${height}`;
    return `<svg x="${box.x}" y="${box.y}" width="${w}" height="${h}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${innerSvg(svg)}</svg>`;
  }
}

export function canvas(width: number, height: number, background: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${background}"/>${body}</svg>`;
}

/** Small seeded random generator, so every build renders identical images. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
