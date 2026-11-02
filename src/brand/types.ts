// The shape of src/brand/brand.config.server.ts. Types only: nothing here
// reaches the browser, and it holds no brand content.

export type ColorRole = 'ink' | 'paper' | 'brand' | 'accent' | 'support';

export type BrandColor = {
  /** Stable id used in token names, like `peel`. Lowercase letters and dashes. */
  id: string;
  name: string;
  hex: string;
  /** Exactly one each of ink, paper, and brand. The site's theme uses these. */
  role: ColorRole;
  usage: string;
  /** Rough share of a layout, in percent. Drawn as the proportion bar. */
  proportion: number;
  /** Only shown when given; these can't be reliably calculated. */
  cmyk?: string;
  pantone?: string;
};

export type FontFile = {
  weight: number;
  style?: 'normal' | 'italic';
  /** Path inside brand-files/. woff2 recommended; static weights, not variable. */
  file: string;
};

export type BrandFont = {
  family: string;
  fallback: 'serif' | 'sans-serif' | 'monospace';
  files: FontFile[];
  /** Weight the guide's specimen uses. */
  specimenWeight: number;
  usage: string;
  license: {
    name: string;
    /** Set to true only when the license lets you hand out the font files. */
    allowsDownload: boolean;
    /** License text inside brand-files/, shipped next to the fonts. */
    file?: string;
  };
};

export type TypeRole =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'small'
  | 'label';

export type TypeStep = {
  id: TypeRole;
  name: string;
  font: 'display' | 'text' | 'mono';
  weight: number;
  sizePx: number;
  /** Unitless, like 1.05. */
  lineHeight: number;
  /** In em, like -0.02. */
  tracking: number;
  uppercase?: boolean;
  usage: string;
};

export type SpacingStep = { id: string; px: number; usage: string };

export type LogoVariant = {
  id: string;
  name: string;
  /** Source SVG inside brand-files/. */
  file: string;
  use: string;
  /** Clear space on every side, as a share of the logo's height. */
  clearSpace: number;
  minWidthPx: number;
  minWidthMm: number;
};

/** Hex replacements applied to the source SVG for one background. */
export type LogoColorway = {
  name: string;
  replace: Record<string, string>;
};

export type TextBlock = { title: string; body: string };

export type ImageryScene =
  | 'tide'
  | 'fizz'
  | 'citrus'
  | 'glass'
  | 'chart'
  | 'pattern'
  | 'blocks';

export type ImageryExample = {
  id: string;
  scene: ImageryScene;
  title: string;
  caption: string;
  /** Alt text for the rendered image. */
  alt: string;
  /** Palette ids: background first, then the colors laid on top. */
  colors: [string, string, string, string];
  /** Labels drawn in the `chart` scene. */
  labels?: string[];
};

export type PackagingItem = {
  label: string;
  sublabel: string;
  /** Palette id of the pack's main color. */
  color: string;
};

export type Applications = {
  socialPost: {
    kicker: string;
    headline: string;
    footer: string;
    alt: string;
    caption: string;
  };
  businessCard: {
    name: string;
    title: string;
    phone: string;
    address: string;
    spec: string;
    alt: string;
    caption: string;
  };
  packaging: {
    /** Pick the silhouette that suits the product. */
    shape: 'can' | 'box';
    items: PackagingItem[];
    spec: string;
    alt: string;
    caption: string;
  };
  slide: {
    kicker: string;
    title: string;
    body: string;
    stat: string;
    statLabel: string;
    footer: string;
    alt: string;
    caption: string;
  };
  poster: {
    scene: ImageryScene;
    colors: [string, string, string, string];
    headline: string;
    subline: string;
    alt: string;
    caption: string;
  };
};

export type BrandConfig = {
  name: string;
  tagline: string;
  /** One or two sentences. Used for search results and link previews. */
  description: string;
  contactEmail: string;
  overview: {
    statement: string;
    pillars: TextBlock[];
  };
  logos: {
    intro: string;
    /** Variant used for favicons. A square mark works best. */
    faviconVariant: string;
    variants: LogoVariant[];
    colorways: {
      light: LogoColorway;
      dark: LogoColorway;
      brand: LogoColorway;
    };
  };
  colors: BrandColor[];
  colorIntro: string;
  fonts: {
    display: BrandFont;
    text: BrandFont;
    mono?: BrandFont;
  };
  typeIntro: string;
  /** Sentence shown in the editable test line. */
  testLine: string;
  typeScale: TypeStep[];
  spacing: SpacingStep[];
  voice: {
    summary: string;
    principles: TextBlock[];
    pairs: { context: string; write: string; avoid: string; why: string }[];
  };
  imagery: {
    summary: string;
    principles: TextBlock[];
    examples: ImageryExample[];
  };
  applications: Applications;
  /** Newest first. The first entry is the guide's current version and date. */
  changelog: { version: string; date: string; changes: string[] }[];
};
