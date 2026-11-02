// What the browser receives from getGuide. Types only, safe to import anywhere.

import type { TextBlock, TypeRole } from './types';
import type { Surface } from '~/lib/brand-files';

export type WcagLabel = 'Pass AAA' | 'Pass AA' | 'Large only' | 'Fail';

export type ColorValue = { label: string; value: string };

export type SwatchView = {
  id: string;
  name: string;
  hex: string;
  role: string;
  usage: string;
  proportion: number;
  /** Text color that holds 4.5:1 on this swatch. */
  on: string;
  muted: string;
  values: ColorValue[];
};

export type ContrastCell = {
  ratio: string;
  label: WcagLabel;
  passes: boolean;
  /** Color for the cell's small print, always readable on the cell. */
  note: string;
};

export type LogoVariantView = {
  id: string;
  name: string;
  use: string;
  width: number;
  height: number;
  clearSpace: number;
  minWidthPx: number;
  minWidthMm: number;
  /** Original source file, as supplied. */
  sourceSvg: string;
  surfaces: {
    id: Surface;
    name: string;
    background: string;
    text: string;
    svg: string;
    svgDownload: string;
    pngs: { size: number; href: string }[];
  }[];
};

export type FontView = {
  role: 'display' | 'text' | 'mono';
  roleLabel: string;
  family: string;
  stack: string;
  specimenWeight: number;
  usage: string;
  licenseName: string;
  allowsDownload: boolean;
  weights: { weight: number; href: string | null; size: string | null }[];
  licenseHref: string | null;
};

export type TypeStepView = {
  id: TypeRole;
  name: string;
  fontFamily: string;
  stack: string;
  weight: number;
  sizePx: number;
  lineHeight: number;
  tracking: number;
  uppercase: boolean;
  usage: string;
};

export type ImageView = {
  id: string;
  title: string;
  caption: string;
  alt: string;
  src: string;
  width: number;
  height: number;
};

export type FileView = {
  key: string;
  label: string;
  format: string;
  size: string;
  href: string;
  zipPath: string | null;
};

export type TokenFormatView = {
  id: 'css' | 'tailwind' | 'json';
  label: string;
  fileName: string;
  code: string;
  href: string;
  size: string;
};

export type SearchItem = {
  kind: 'section' | 'color';
  title: string;
  /** Page the section is on, or the color's hex. */
  detail: string;
  to: string;
  hash?: string;
  swatch?: string;
  keywords: string[];
};

export type PageCopy = { lead: string; description: string };

export type GuideView = {
  /** True when a password protects the site. */
  protected: boolean;
  name: string;
  tagline: string;
  description: string;
  contactEmail: string;
  version: string;
  updated: string;
  themeCss: string;
  fontPreloads: string[];
  favicon: string;
  appleTouchIcon: string;
  shareImage: string;
  /** The small logo on the brand color, used large on the opening page. */
  coverMark: string;
  themeColor: string;
  primaryLogo: { light: string; dark: string; brand: string; width: number; height: number; alt: string };
  pages: Record<string, PageCopy>;
  search: SearchItem[];
  overview: {
    statement: string;
    pillars: TextBlock[];
    quickDownloads: { title: string; detail: string; href: string }[];
  };
  logo: {
    variants: LogoVariantView[];
    misuse: {
      wrongColor: string;
      lowContrastBackground: string;
    };
  };
  color: {
    swatches: SwatchView[];
    contrast: ContrastCell[][];
  };
  type: {
    testLine: string;
    fonts: FontView[];
    scale: TypeStepView[];
  };
  imagery: { principles: TextBlock[]; examples: ImageView[] };
  voice: {
    principles: TextBlock[];
    pairs: { context: string; write: string; avoid: string; why: string }[];
  };
  applications: ImageView[];
  tokens: {
    formats: TokenFormatView[];
    spacing: { id: string; px: number; usage: string }[];
  };
  downloads: {
    zip: FileView;
    fileCount: number;
    groups: { name: string; files: FileView[] }[];
  };
  changelog: { version: string; date: string; dateLabel: string; changes: string[] }[];
  /** Local preview only: why brand files failed to sync. Null in production. */
  syncErrors: string[] | null;
};
