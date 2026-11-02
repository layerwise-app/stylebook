// Sets real brand type as outlines, so rendered images need no installed fonts.
// Lays glyphs out one at a time with kerning from the font.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// The package's CommonJS build only has a default export at runtime.
// oxlint-disable-next-line import/default
import opentype, { type Font, type Glyph, type Path } from 'opentype.js';
import wawoff2 from 'wawoff2';
import type { BrandConfig, BrandFont } from '../../src/brand/types';

type Role = 'display' | 'text' | 'mono';
type Loaded = { weight: number; font: Font };

async function parseFont(path: string) {
  try {
    const bytes = readFileSync(path);
    const sfnt = path.endsWith('.woff2')
      ? new Uint8Array(await wawoff2.decompress(bytes))
      : new Uint8Array(bytes);
    // oxlint-disable-next-line import/no-named-as-default-member
    return opentype.parse(
      sfnt.buffer.slice(sfnt.byteOffset, sfnt.byteOffset + sfnt.byteLength)
    );
  } catch (error) {
    throw new Error(`${path} can't be read as a font: ${(error as Error).message}`, { cause: error });
  }
}

const number = (n: number) => +n.toFixed(2);

// opentype.js's own toPathData can emit values SVG parsers stop on, which cuts
// the text off mid-string, so paths are written out by hand.
function pathData(path: Path) {
  return path.commands
    .map((c) => {
      if (c.type === 'M' || c.type === 'L') return `${c.type}${number(c.x)} ${number(c.y)}`;
      if (c.type === 'Q') return `Q${number(c.x1)} ${number(c.y1)} ${number(c.x)} ${number(c.y)}`;
      if (c.type === 'C') {
        return `C${number(c.x1)} ${number(c.y1)} ${number(c.x2)} ${number(c.y2)} ${number(c.x)} ${number(c.y)}`;
      }
      return 'Z';
    })
    .join('');
}

export type LineOptions = {
  role: Role;
  weight?: number;
  size: number;
  x: number;
  y: number;
  fill: string;
  tracking?: number;
  anchor?: 'start' | 'middle' | 'end';
  uppercase?: boolean;
};

export class Typesetter {
  private constructor(private fonts: Record<Role, Loaded[]>) {}

  static async load(config: BrandConfig, filesRoot: string) {
    const load = async (font: BrandFont | undefined) => {
      const files = (font ?? config.fonts.text).files.filter(
        (f) => (f.style ?? 'normal') === 'normal'
      );
      // One at a time: wawoff2 shares one WASM heap between calls.
      const loaded: Loaded[] = [];
      for (const f of files) {
        loaded.push({ weight: f.weight, font: await parseFont(join(filesRoot, f.file)) });
      }
      return loaded;
    };
    return new Typesetter({
      display: await load(config.fonts.display),
      text: await load(config.fonts.text),
      mono: await load(config.fonts.mono)
    });
  }

  private pick(role: Role, weight = 400) {
    const list = this.fonts[role];
    return list.reduce((best, item) =>
      Math.abs(item.weight - weight) < Math.abs(best.weight - weight) ? item : best
    ).font;
  }

  private layout(font: Font, text: string, size: number, tracking: number) {
    const scale = size / font.unitsPerEm;
    // charToGlyph skips GSUB; opentype.js can't run every substitution table.
    const glyphs = Array.from(text, (char) => font.charToGlyph(char));
    const placed: { glyph: Glyph; x: number }[] = [];
    let x = 0;
    glyphs.forEach((glyph, i) => {
      placed.push({ glyph, x });
      const next = glyphs[i + 1];
      const kern = next ? font.getKerningValue(glyph, next) : 0;
      x += ((glyph.advanceWidth ?? font.unitsPerEm / 2) + kern) * scale;
      if (next) x += tracking * size;
    });
    return { placed, width: x };
  }

  width(text: string, o: { role: Role; weight?: number; size: number; tracking?: number; uppercase?: boolean }) {
    const value = o.uppercase ? text.toUpperCase() : text;
    return this.layout(this.pick(o.role, o.weight), value, o.size, o.tracking ?? 0).width;
  }

  line(text: string, o: LineOptions) {
    const font = this.pick(o.role, o.weight);
    const value = o.uppercase ? text.toUpperCase() : text;
    const { placed, width } = this.layout(font, value, o.size, o.tracking ?? 0);
    const start =
      o.anchor === 'middle' ? o.x - width / 2 : o.anchor === 'end' ? o.x - width : o.x;
    const d = placed
      .map(({ glyph, x }) => pathData(glyph.getPath(start + x, o.y, o.size)))
      .join('');
    return `<path fill="${o.fill}" d="${d}"/>`;
  }

  wrap(text: string, o: { role: Role; weight?: number; size: number; tracking?: number; maxWidth: number }) {
    const lines: string[] = [];
    let current = '';
    for (const word of text.split(/\s+/)) {
      const attempt = current ? `${current} ${word}` : word;
      if (current && this.width(attempt, o) > o.maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = attempt;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  /** The largest size where the text fits the box, and its lines. */
  fit(
    text: string,
    o: { role: Role; weight?: number; tracking?: number; maxWidth: number; maxHeight: number; maxSize: number; minSize?: number; leading: number }
  ) {
    const min = o.minSize ?? 12;
    for (let size = o.maxSize; size > min; size -= 2) {
      const lines = this.wrap(text, { ...o, size });
      const tallEnough = lines.length * size * o.leading <= o.maxHeight;
      const wideEnough = lines.every((l) => this.width(l, { ...o, size }) <= o.maxWidth);
      if (tallEnough && wideEnough) return { size, lines };
    }
    return { size: min, lines: this.wrap(text, { ...o, size: min }) };
  }

  /** Multi-line block with its first baseline at `y`. Returns the markup and end. */
  block(lines: string[], o: LineOptions & { leading: number }) {
    const markup = lines
      .map((l, i) => this.line(l, { ...o, y: number(o.y + i * o.size * o.leading) }))
      .join('');
    return { markup, bottom: o.y + (lines.length - 1) * o.size * o.leading };
  }
}
