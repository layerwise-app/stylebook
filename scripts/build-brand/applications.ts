// The brand in use. Every layout is built from the config's copy, colors, type,
// and logos, so a new brand gets finished pieces with no extra design work.

import { mixColors } from '../../src/lib/color';
import { canvas, Kit } from './kit';
import { scenes } from './scenes';

export type Art = { id: string; title: string; width: number; height: number; svg: string };

const clip = (id: string, x: number, y: number, w: number, h: number) =>
  `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`;

function socialPost(kit: Kit): Art {
  const copy = kit.config.applications.socialPost;
  const [W, H] = [1080, 1350];
  const bg = kit.brand;
  const text = kit.theme.brand.text;
  const margin = 72;
  const size = kit.type.fit(copy.headline, {
    role: 'display',
    maxWidth: W - margin * 2,
    maxHeight: 640,
    maxSize: 180,
    minSize: 60,
    leading: 0.98,
    tracking: -0.02
  });
  const head = kit.type.block(size.lines, {
    role: 'display',
    size: size.size,
    leading: 0.98,
    x: margin,
    y: 170 + size.size * 0.85,
    fill: text,
    tracking: -0.02
  });
  const mark = H * 0.44;
  const body =
    `<defs>${clip('frame', 0, 0, W, H)}</defs><g clip-path="url(#frame)">` +
    kit.logo(kit.markVariant, 'brand', { x: W - mark * 0.78, y: H - mark * 0.78, width: mark, height: mark }) +
    '</g>' +
    kit.type.line(copy.kicker, { role: 'mono', size: 26, x: margin, y: 104, fill: text, tracking: 0.04, uppercase: true, weight: 500 }) +
    head.markup +
    kit.type.line(copy.footer, { role: 'mono', size: 26, x: margin, y: H - 72, fill: text, tracking: 0.04, weight: 500 });
  return { id: 'social-post', title: 'Social post', width: W, height: H, svg: canvas(W, H, bg, body) };
}

function businessCard(kit: Kit): Art {
  const copy = kit.config.applications.businessCard;
  const [W, H] = [2000, 1040];
  const board = kit.theme.tint.background;
  const boardText = kit.theme.tint.text;
  const [cw, ch] = [850, 550];
  const gap = 84;
  const x0 = (W - cw * 2 - gap) / 2;
  const y0 = 170;
  const marks = (x: number, y: number) => {
    const len = 26;
    const off = 14;
    const line = (a: number, b: number, c: number, d: number) =>
      `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${boardText}" stroke-width="1.5"/>`;
    return [
      line(x - off - len, y, x - off, y),
      line(x, y - off - len, x, y - off),
      line(x + cw + off, y, x + cw + off + len, y),
      line(x + cw, y - off - len, x + cw, y - off),
      line(x - off - len, y + ch, x - off, y + ch),
      line(x, y + ch + off, x, y + ch + off + len),
      line(x + cw + off, y + ch, x + cw + off + len, y + ch),
      line(x + cw, y + ch + off, x + cw, y + ch + off + len)
    ].join('');
  };
  const backX = x0 + cw + gap;
  const brandText = kit.theme.brand.text;
  const primary = kit.config.logos.variants[0]!.id;
  const logoWidth = Math.min(560, 200 * kit.logoAspect(primary));
  const name = kit.type.fit(copy.name, { role: 'display', maxWidth: cw - 120, maxHeight: 120, maxSize: 74, minSize: 36, leading: 1 });
  const details = [copy.phone, kit.config.contactEmail, copy.address];
  const body =
    kit.type.line('Front', { role: 'mono', size: 22, x: x0, y: 90, fill: boardText, tracking: 0.04, uppercase: true, weight: 500 }) +
    kit.type.line('Back', { role: 'mono', size: 22, x: backX, y: 90, fill: boardText, tracking: 0.04, uppercase: true, weight: 500 }) +
    `<rect x="${x0}" y="${y0}" width="${cw}" height="${ch}" fill="${kit.paper}"/>` +
    kit.logo(primary, 'light', {
      x: x0 + (cw - logoWidth) / 2,
      y: y0 + (ch - logoWidth / kit.logoAspect(primary)) / 2,
      width: logoWidth
    }) +
    `<rect x="${backX}" y="${y0}" width="${cw}" height="${ch}" fill="${kit.brand}"/>` +
    kit.type.block(name.lines, { role: 'display', size: name.size, leading: 1, x: backX + 60, y: y0 + 60 + name.size * 0.85, fill: brandText }).markup +
    kit.type.line(copy.title, { role: 'text', weight: 500, size: 30, x: backX + 60, y: y0 + 60 + name.size * name.lines.length + 34, fill: brandText }) +
    details
      .map((line, i) =>
        kit.type.line(line, { role: 'mono', size: 25, x: backX + 60, y: y0 + ch - 60 - (details.length - 1 - i) * 38, fill: brandText })
      )
      .join('') +
    kit.logo(kit.markVariant, 'brand', { x: backX + cw - 60 - 110, y: y0 + 60, width: 110, height: 110 }) +
    marks(x0, y0) +
    marks(backX, y0) +
    kit.type.line(copy.spec, { role: 'mono', size: 22, x: W / 2, y: H - 110, fill: boardText, tracking: 0.04, anchor: 'middle' });
  return { id: 'business-card', title: 'Business card', width: W, height: H, svg: canvas(W, H, board, body) };
}

function packaging(kit: Kit): Art {
  const copy = kit.config.applications.packaging;
  const [W, H] = [2000, 1400];
  const ground = kit.theme.tint.background;
  const groundText = kit.theme.tint.text;
  const items = copy.items.slice(0, 4);
  const packW = Math.min(440, (W - 240 - (items.length - 1) * 70) / items.length);
  const packH = 1040;
  const total = items.length * packW + (items.length - 1) * 70;
  const baseY = 1240;
  const metal = mixColors(kit.paper, kit.ink, 0.42);
  const stacked = kit.config.logos.variants.find((v) => v.id === 'stacked')?.id ?? kit.config.logos.variants[0]!.id;
  const packs = items
    .map((item, i) => {
      const x = (W - total) / 2 + i * (packW + 70);
      const top = baseY - packH;
      const field = kit.color(item.color);
      const text = kit.textOn(field);
      const watermark = mixColors(field, text, 0.1);
      const cx = x + packW / 2;
      const id = `pack${i}`;
      let silhouette: string;
      let bodyTop: number;
      let bodyBottom: number;
      if (copy.shape === 'can') {
        const inset = packW * 0.09;
        const neck = 46;
        bodyTop = top + neck + 12;
        bodyBottom = baseY - 34;
        silhouette =
          `<rect x="${x + inset - 8}" y="${top}" width="${packW - inset * 2 + 16}" height="12" fill="${metal}"/>` +
          `<path fill="${metal}" d="M${x + inset} ${top + 12}L${x + packW - inset} ${top + 12}L${x + packW} ${bodyTop}L${x} ${bodyTop}Z"/>` +
          `<path fill="${metal}" d="M${x} ${bodyBottom}L${x + packW} ${bodyBottom}L${x + packW - inset * 0.6} ${baseY}L${x + inset * 0.6} ${baseY}Z"/>`;
      } else {
        bodyTop = top + 44;
        bodyBottom = baseY;
        silhouette =
          `<path fill="${mixColors(field, text, 0.22)}" d="M${x} ${bodyTop}L${x + 26} ${top}L${x + packW - 26} ${top}L${x + packW} ${bodyTop}Z"/>`;
      }
      const bodyH = bodyBottom - bodyTop;
      const margin = packW * 0.1;
      const label = kit.type.fit(item.label, {
        role: 'display',
        maxWidth: packW - margin * 2,
        maxHeight: 180,
        maxSize: 112,
        minSize: 40,
        leading: 1
      });
      const sublines = kit.type.wrap(item.sublabel, { role: 'text', weight: 500, size: 25, maxWidth: packW - margin * 2 });
      const logoW = packW * 0.56;
      const surface = kit.bestSurface(stacked, field);
      const mark = packW * 1.32;
      return (
        silhouette +
        `<defs>${clip(id, x, bodyTop, packW, bodyH)}</defs>` +
        `<rect x="${x}" y="${bodyTop}" width="${packW}" height="${bodyH}" fill="${field}"/>` +
        `<g clip-path="url(#${id})">` +
        kit.logoTinted(kit.markVariant, watermark, field, { x: cx - mark * 0.32, y: bodyBottom - mark * 0.62, width: mark, height: mark }) +
        '</g>' +
        kit.logo(stacked, surface, { x: cx - logoW / 2, y: bodyTop + 54, width: logoW }) +
        kit.type.block(label.lines, { role: 'display', size: label.size, leading: 1, x: x + margin, y: bodyTop + bodyH * 0.6, fill: text }).markup +
        kit.type.block(sublines, { role: 'text', weight: 500, size: 25, leading: 1.3, x: x + margin, y: bodyTop + bodyH * 0.6 + label.lines.length * label.size * 0.72, fill: text }).markup
      );
    })
    .join('');
  const body =
    packs +
    `<rect x="0" y="${baseY}" width="${W}" height="2" fill="${groundText}"/>` +
    kit.type.line(copy.spec, { role: 'mono', size: 24, x: W / 2, y: baseY + 76, fill: groundText, tracking: 0.04, anchor: 'middle' });
  return { id: 'packaging', title: 'Packaging', width: W, height: H, svg: canvas(W, H, ground, body) };
}

function slide(kit: Kit): Art {
  const copy = kit.config.applications.slide;
  const [W, H] = [1920, 1080];
  const panelX = 1240;
  const text = kit.theme.paper.text;
  const brandText = kit.theme.brand.text;
  const margin = 90;
  const width = panelX - margin * 2;
  const title = kit.type.fit(copy.title, { role: 'display', maxWidth: width, maxHeight: 500, maxSize: 136, minSize: 56, leading: 1.02, tracking: -0.015 });
  const titleY = 250 + title.size * 0.8;
  const head = kit.type.block(title.lines, { role: 'display', size: title.size, leading: 1.02, x: margin, y: titleY, fill: text, tracking: -0.015 });
  const lines = kit.type.wrap(copy.body, { role: 'text', size: 34, maxWidth: width - 40 });
  const stat = kit.type.fit(copy.stat, { role: 'display', maxWidth: W - panelX - 100, maxHeight: 340, maxSize: 280, minSize: 60, leading: 1 });
  const primary = kit.config.logos.variants[0]!.id;
  const logoH = 58;
  const body =
    `<rect x="${panelX}" y="0" width="${W - panelX}" height="${H}" fill="${kit.brand}"/>` +
    kit.type.line(copy.kicker, { role: 'mono', size: 25, x: margin, y: 120, fill: text, tracking: 0.04, uppercase: true, weight: 500 }) +
    head.markup +
    kit.type.block(lines, { role: 'text', size: 34, leading: 1.4, x: margin, y: head.bottom + 92, fill: text }).markup +
    kit.logo(primary, 'light', { x: margin, y: H - 80 - logoH, height: logoH }) +
    kit.type.line(copy.footer, { role: 'mono', size: 22, x: panelX - margin, y: H - 92, fill: text, tracking: 0.02, anchor: 'end' }) +
    kit.type.line(stat.lines.join(' '), { role: 'display', size: stat.size, x: panelX + 60, y: H / 2 + stat.size * 0.2, fill: brandText }) +
    kit.type.line(copy.statLabel, { role: 'mono', size: 25, x: panelX + 60, y: H / 2 + stat.size * 0.2 + stat.size * 0.3 + 56, fill: brandText, tracking: 0.03, uppercase: true, weight: 500 });
  return { id: 'slide', title: 'Slide', width: W, height: H, svg: canvas(W, H, kit.paper, body) };
}

function poster(kit: Kit): Art {
  const copy = kit.config.applications.poster;
  const [W, H] = [1200, 1696];
  const sceneH = 1040;
  const palette = copy.colors.map((id) => kit.color(id)) as [string, string, string, string];
  const margin = 64;
  const bg = kit.ink;
  const text = kit.theme.ink.text;
  const head = kit.type.fit(copy.headline, { role: 'display', maxWidth: W - margin * 2, maxHeight: 300, maxSize: 170, minSize: 60, leading: 1, tracking: -0.02 });
  const headY = sceneH + 70 + head.size * 0.82;
  const headBlock = kit.type.block(head.lines, { role: 'display', size: head.size, leading: 1, x: margin, y: headY, fill: text, tracking: -0.02 });
  const sub = kit.type.fit(copy.subline, { role: 'display', maxWidth: W - margin * 2, maxHeight: 120, maxSize: 72, minSize: 36, leading: 1.05, tracking: -0.01 });
  const primary = kit.config.logos.variants[0]!.id;
  const body =
    `<defs>${clip('scene', 0, 0, W, sceneH)}</defs>` +
    `<g clip-path="url(#scene)"><rect width="${W}" height="${sceneH}" fill="${palette[0]}"/>${scenes[copy.scene](kit, W, sceneH, palette)}</g>` +
    headBlock.markup +
    kit.type.block(sub.lines, { role: 'display', size: sub.size, leading: 1.05, x: margin, y: headBlock.bottom + sub.size * 1.5, fill: text, tracking: -0.01 }).markup +
    kit.logo(primary, 'dark', { x: margin, y: H - 64 - 84, height: 84 });
  return { id: 'poster', title: 'Poster', width: W, height: H, svg: canvas(W, H, bg, body) };
}

export function applicationArt(kit: Kit): Art[] {
  return [socialPost(kit), packaging(kit), slide(kit), businessCard(kit), poster(kit)];
}

export function imageryArt(kit: Kit): Art[] {
  const [W, H] = [1600, 1000];
  return kit.config.imagery.examples.map((example) => {
    const palette = example.colors.map((id) => kit.color(id)) as [string, string, string, string];
    return {
      id: example.id,
      title: example.title,
      width: W,
      height: H,
      svg: canvas(W, H, palette[0], scenes[example.scene](kit, W, H, palette, example.labels))
    };
  });
}

/** 1200 × 630 link preview image. */
export function shareArt(kit: Kit) {
  const [W, H] = [1200, 630];
  const text = kit.theme.brand.text;
  const primary = kit.config.logos.variants[0]!.id;
  const margin = 72;
  const logoW = Math.min(620, 150 * kit.logoAspect(primary));
  const tagline = kit.type.fit(kit.config.tagline, {
    role: 'display',
    maxWidth: W - margin * 2,
    maxHeight: 280,
    maxSize: 86,
    minSize: 36,
    leading: 1.04,
    tracking: -0.015
  });
  const lines = tagline.lines.length;
  const body =
    kit.logo(primary, 'brand', { x: margin, y: margin, width: logoW }) +
    kit.type.block(tagline.lines, {
      role: 'display',
      size: tagline.size,
      leading: 1.04,
      x: margin,
      y: H - margin - (lines - 1) * tagline.size * 1.04,
      fill: text,
      tracking: -0.015
    }).markup;
  return canvas(W, H, kit.brand, body);
}
