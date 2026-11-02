// Imagery scenes: flat, hard-edged compositions built from palette colors. Each
// returns SVG markup for a width × height frame.

import type { ImageryScene } from '../../src/brand/types';
import { Kit, seeded } from './kit';

type Palette = [string, string, string, string];
type Scene = (kit: Kit, w: number, h: number, p: Palette, labels?: string[]) => string;

const n = (v: number) => +v.toFixed(1);
const disc = (x: number, y: number, r: number, fill: string) =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}"/>`;

function waveBand(w: number, h: number, y: number, amp: number, length: number, phase: number, fill: string) {
  let d = `M0 ${h}L0 ${n(y + amp * Math.sin(phase))}`;
  for (let x = 8; x <= w + 8; x += 8) {
    d += `L${x} ${n(y + amp * Math.sin((x / length) * 2 * Math.PI + phase))}`;
  }
  return `<path fill="${fill}" d="${d}L${w + 8} ${h}Z"/>`;
}

const tide: Scene = (_kit, w, h, [, sun, deep, pale]) => {
  const bands = [
    { y: 0.5, amp: 0.03, len: 1.1, phase: 0.2, fill: pale },
    { y: 0.6, amp: 0.035, len: 0.8, phase: 2.1, fill: deep },
    { y: 0.72, amp: 0.03, len: 0.95, phase: 4.1, fill: pale },
    { y: 0.84, amp: 0.028, len: 0.7, phase: 1.1, fill: deep }
  ];
  return (
    disc(w * 0.66, h * 0.42, h * 0.27, sun) +
    bands
      .map((b) => waveBand(w, h, h * b.y, h * b.amp, w * b.len, b.phase, b.fill))
      .join('')
  );
};

const fizz: Scene = (_kit, w, h, [, main, hot, soft]) => {
  const random = seeded(21);
  const placed: { x: number; y: number; r: number }[] = [];
  // Rising means small and crowded low down, large and sparse up high.
  for (let tries = 0; tries < 9000 && placed.length < 520; tries++) {
    const rise = random() ** 2.1;
    const r = 2.5 + rise * (h * 0.05);
    const spread = 0.34 + rise * 0.66;
    const x = w * (0.5 + (random() - 0.5) * spread);
    const y = h * (1.02 - rise * 1.02);
    if (placed.every((p) => Math.hypot(p.x - x, p.y - y) > p.r + r + 2.5)) {
      placed.push({ x, y, r });
    }
  }
  const largest = placed
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.y > h * 0.14 && p.y < h * 0.5 && p.x > w * 0.5)
    .sort((a, b) => b.r - a.r)[0]?.i;
  return placed
    .map((p, i) =>
      disc(p.x, p.y, p.r, i === largest ? hot : i % 7 === 0 ? soft : main)
    )
    .join('');
};

function citrusWheel(cx: number, cy: number, R: number, rind: string, pith: string, flesh: string, seeds: string, count = 11) {
  let body = disc(cx, cy, R, rind) + disc(cx, cy, R * 0.93, pith);
  const gap = (R * 0.022) / (R * 0.5);
  const outer = R * 0.86;
  const inner = R * 0.07;
  for (let i = 0; i < count; i++) {
    const a0 = (i * 2 * Math.PI) / count + gap;
    const a1 = ((i + 1) * 2 * Math.PI) / count - gap;
    const mid = (a0 + a1) / 2;
    const ix = cx + inner * Math.cos(mid);
    const iy = cy + inner * Math.sin(mid);
    const x0 = cx + outer * Math.cos(a0);
    const y0 = cy + outer * Math.sin(a0);
    const x1 = cx + outer * Math.cos(a1);
    const y1 = cy + outer * Math.sin(a1);
    body += `<path fill="${flesh}" stroke="${flesh}" stroke-width="${n(R * 0.03)}" stroke-linejoin="round" d="M${n(ix)} ${n(iy)}L${n(x0)} ${n(y0)}A${n(outer)} ${n(outer)} 0 0 1 ${n(x1)} ${n(y1)}Z"/>`;
    body += disc(
      cx + R * 0.46 * Math.cos(mid + (i % 2 ? 0.05 : -0.05)),
      cy + R * 0.46 * Math.sin(mid + (i % 2 ? 0.05 : -0.05)),
      R * 0.022,
      seeds
    );
  }
  return body;
}

const citrus: Scene = (_kit, w, h, [, pith, flesh, seed]) =>
  citrusWheel(w * 0.64, h * 0.6, h * 0.86, flesh, pith, flesh, seed, 11) +
  citrusWheel(w * 0.08, h * 0.08, h * 0.34, pith, flesh, pith, seed, 9);

const glass: Scene = (kit, w, h, [bg, dark, light, hot]) => {
  const table = h * 0.84;
  const top = h * 0.12;
  const halfTop = w * 0.125;
  const halfBase = w * 0.098;
  const cx = w * 0.5;
  const edgeAt = (y: number) => halfBase + (halfTop - halfBase) * ((table - y) / (table - top));
  const level = h * 0.27;
  const stroke = Math.max(5, w * 0.0045);
  const levelHalf = edgeAt(level);
  // The glass is clear above the waterline; only the tonic has color.
  let surface = '';
  for (let t = 0; t <= 1.001; t += 0.05) {
    surface += `${surface ? 'L' : 'M'}${n(cx - levelHalf + t * 2 * levelHalf)} ${n(level + Math.sin(t * 6.283) * h * 0.012)}`;
  }
  const liquid = `${surface}L${n(cx + halfBase)} ${n(table)}L${n(cx - halfBase)} ${n(table)}Z`;
  const random = seeded(7);
  let bubbles = '';
  for (let i = 0; i < 34; i++) {
    const rise = random();
    const y = table - 28 - rise * (table - level - 56);
    const half = edgeAt(y) - 24;
    bubbles += disc(cx + (random() - 0.5) * 2 * half, y, 2 + rise * 7.5, dark);
  }
  const ice = (x: number, y: number, s: number, r: number) =>
    `<rect x="${n(x - s / 2)}" y="${n(y - s / 2)}" width="${n(s)}" height="${n(s)}" fill="${bg}" stroke="${dark}" stroke-width="${n(stroke * 0.8)}" transform="rotate(${r} ${n(x)} ${n(y)})"/>`;
  // A wheel of citrus sits on the rim, in front of the glass.
  const wheelR = h * 0.13;
  const capSize = w * 0.075;
  return (
    // The sun stands on the same line as the glass: one waterline.
    `<clipPath id="above"><rect width="${w}" height="${n(table)}"/></clipPath>` +
    `<g clip-path="url(#above)">${disc(w * 0.23, table, h * 0.3, hot)}</g>` +
    `<rect x="0" y="${n(table)}" width="${w}" height="${n(h - table)}" fill="${dark}"/>` +
    `<path fill="${light}" d="${liquid}"/>` +
    ice(cx - w * 0.038, level + h * 0.1, h * 0.105, 14) +
    ice(cx + w * 0.042, level + h * 0.19, h * 0.1, -18) +
    bubbles +
    `<path fill="none" stroke="${dark}" stroke-width="${n(stroke)}" d="${surface}"/>` +
    `<path fill="none" stroke="${dark}" stroke-width="${n(stroke)}" stroke-linejoin="miter" d="M${n(cx - halfTop)} ${n(top)}L${n(cx - halfBase)} ${n(table)}L${n(cx + halfBase)} ${n(table)}L${n(cx + halfTop)} ${n(top)}"/>` +
    citrusWheel(cx + halfTop - wheelR * 0.1, top + wheelR * 0.2, wheelR, hot, light, hot, light, 9) +
    kit.logoTinted(kit.markVariant, hot, light, {
      x: w * 0.77,
      y: table - capSize,
      width: capSize,
      height: capSize
    })
  );
};

const chart: Scene = (kit, w, h, [, a, b, c], labels = []) => {
  const left = w * 0.07;
  const right = w * 0.95;
  const top = h * 0.12;
  const bottom = h * 0.82;
  const axis = labels.slice(0, -2);
  const notes = labels.slice(-2);
  let grid = '';
  const columns = Math.max(axis.length - 1, 4);
  for (let i = 0; i <= columns; i++) {
    const x = left + ((right - left) * i) / columns;
    grid += `<line x1="${n(x)}" y1="${n(top)}" x2="${n(x)}" y2="${n(bottom)}" stroke="${b}" stroke-opacity=".28" stroke-width="1.5"/>`;
  }
  for (let i = 0; i <= 4; i++) {
    const y = top + ((bottom - top) * i) / 4;
    grid += `<line x1="${n(left)}" y1="${n(y)}" x2="${n(right)}" y2="${n(y)}" stroke="${b}" stroke-opacity=".28" stroke-width="1.5"/>`;
  }
  const curve = (phase: number, amp: number, stroke: string, width: number) => {
    let d = '';
    const mid = (top + bottom) / 2;
    for (let t = 0; t <= 1.0001; t += 0.004) {
      const x = left + (right - left) * t;
      const y = mid - (bottom - top) * amp * Math.sin(t * 2 * Math.PI * 2 + phase);
      d += `${d ? 'L' : 'M'}${n(x)} ${n(y)}`;
    }
    return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="butt"/>`;
  };
  const textColor = b;
  const size = h * 0.026;
  const tick = axis
    .map((label, i) =>
      kit.type.line(label, {
        role: 'mono',
        size,
        x: left + ((right - left) * i) / Math.max(axis.length - 1, 1),
        y: bottom + size * 2,
        fill: textColor,
        anchor: i === 0 ? 'start' : i === axis.length - 1 ? 'end' : 'middle',
        tracking: 0.02
      })
    )
    .join('');
  // First peak of the main curve is at t = 1/8 when phase is 0.
  const px = left + (right - left) * 0.125;
  const py = (top + bottom) / 2 - (bottom - top) * 0.42;
  const qx = left + (right - left) * 0.625;
  const note = (label: string | undefined, x: number, y: number) =>
    label
      ? disc(x, y, h * 0.024, c) +
        kit.type.line(label, { role: 'mono', size, x: x + h * 0.045, y: y - h * 0.03, fill: textColor, tracking: 0.02, uppercase: true, weight: 500 })
      : '';
  return (
    grid +
    curve(2.2, 0.18, b, 5) +
    curve(1, 0.3, c, 7) +
    curve(0, 0.42, a, 11) +
    note(notes[0], px, py) +
    note(notes[1], qx, py) +
    tick
  );
};

const pattern: Scene = (kit, w, h, [, main, hot, rest]) => {
  const size = h / 4.4;
  const stepX = size * 1.36;
  const stepY = size * 1.36;
  const columns = Math.ceil(w / stepX) + 1;
  const rows = Math.ceil(h / stepY) + 1;
  const offsetX = (w - (columns - 1) * stepX) / 2 - size / 2;
  const offsetY = (h - (rows - 1) * stepY) / 2 - size / 2;
  const hotCol = Math.floor(columns * 0.62);
  const hotRow = Math.floor(rows * 0.4);
  let body = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const box = { x: n(offsetX + c * stepX), y: n(offsetY + r * stepY), width: n(size), height: n(size) };
      body +=
        r === hotRow && c === hotCol
          ? kit.logoTinted(kit.markVariant, hot, main, box)
          : kit.logoTinted(kit.markVariant, main, rest, box);
    }
  }
  return body;
};

const blocks: Scene = (_kit, w, h, [bg, a, b, c]) => {
  const columns = 5;
  const size = w / columns;
  const rows = Math.ceil(h / size);
  const random = seeded(11);
  const colors = [a, b, c];
  let body = '';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = col * size;
      const y = row * size;
      const field = random() < 0.28 ? colors[Math.floor(random() * 3)]! : bg;
      const fill = colors.filter((f) => f !== field)[Math.floor(random() * 2)]!;
      body += `<rect x="${n(x)}" y="${n(y)}" width="${n(size + 1)}" height="${n(size + 1)}" fill="${field}"/>`;
      const kind = Math.floor(random() * 4);
      if (kind === 0) body += disc(x + size / 2, y + size / 2, size * 0.42, fill);
      if (kind === 1) {
        const cx = random() < 0.5 ? x : x + size;
        const cy = random() < 0.5 ? y : y + size;
        body += `<clipPath id="q${row}-${col}"><rect x="${n(x)}" y="${n(y)}" width="${n(size)}" height="${n(size)}"/></clipPath><circle clip-path="url(#q${row}-${col})" cx="${n(cx)}" cy="${n(cy)}" r="${n(size)}" fill="${fill}"/>`;
      }
      if (kind === 2) {
        body += `<rect x="${n(x)}" y="${n(y + size / 2)}" width="${n(size)}" height="${n(size / 2)}" fill="${fill}"/>`;
      }
    }
  }
  return body;
};

export const scenes: Record<ImageryScene, Scene> = {
  tide,
  fizz,
  citrus,
  glass,
  chart,
  pattern,
  blocks
};
