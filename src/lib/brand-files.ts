// Names and types for files under brand-files/. A file's key in Storage, and in
// its /files/<key> URL, is its path inside brand-files/.

export const PNG_SIZES = [512, 1024, 2048] as const;
export type PngSize = (typeof PNG_SIZES)[number];
export type Surface = 'light' | 'dark' | 'brand';
export const SURFACES: Surface[] = ['light', 'dark', 'brand'];

export const GENERATED_DIR = 'generated';
export const MANIFEST_FILE = 'generated/manifest.json';
export const ZIP_KEY = 'generated/brand-assets.zip';

export const logoSvgKey = (variant: string, surface: Surface) =>
  `generated/logos/svg/${variant}-on-${surface}.svg`;
export const logoPngKey = (variant: string, surface: Surface, size: PngSize) =>
  `generated/logos/png/${variant}-on-${surface}-${size}.png`;
export const tokenKey = (file: 'tokens.css' | 'tailwind-theme.css' | 'tokens.json') =>
  `generated/tokens/${file}`;
export const applicationKey = (id: string) => `generated/applications/${id}.png`;
export const imageryKey = (id: string) => `generated/imagery/${id}.png`;
export const SHARE_IMAGE_KEY = 'generated/web/share.png';
export const FAVICON_32_KEY = 'generated/web/favicon-32.png';
export const FAVICON_180_KEY = 'generated/web/apple-touch-icon-180.png';

const contentTypes: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  zip: 'application/zip'
};

export function extensionOf(key: string) {
  return key.split('.').pop()?.toLowerCase() ?? '';
}

export function contentTypeOf(key: string) {
  return contentTypes[extensionOf(key)] ?? 'application/octet-stream';
}

export type ManifestFile = {
  key: string;
  sha256: string;
  size: number;
  contentType: string;
  /** Uppercase file type, like SVG. */
  format: string;
  label: string;
  /** Downloads page group. Null keeps the file out of Downloads and the zip. */
  group: string | null;
  /** Path inside brand-assets.zip. Null when the file isn't in the zip. */
  zipPath: string | null;
  width?: number;
  height?: number;
};

export type BrandManifest = {
  /** Hash of everything the build reads, used to spot a stale build. */
  inputHash: string;
  groups: string[];
  files: ManifestFile[];
  logos: Record<string, { width: number; height: number; fills: string[] }>;
};
