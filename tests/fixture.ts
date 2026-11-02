import type { BrandConfig } from '../src/brand/types';

/** A small invented brand, independent of whichever brand is configured. */
export const fixture: Pick<
  BrandConfig,
  'name' | 'colors' | 'fonts' | 'typeScale' | 'spacing'
> = {
  name: 'Fixture Co',
  colors: [
    { id: 'night', name: 'Night', hex: '#101820', role: 'ink', usage: 'Text', proportion: 30 },
    { id: 'chalk', name: 'Chalk', hex: '#fafafa', role: 'paper', usage: 'Ground', proportion: 50 },
    {
      id: 'lemon',
      name: 'Lemon',
      hex: '#FFE600',
      role: 'brand',
      usage: 'Fields',
      proportion: 20,
      cmyk: '0 / 5 / 100 / 0',
      pantone: 'PANTONE Yellow C'
    }
  ],
  fonts: {
    display: {
      family: 'Fixture Display',
      fallback: 'serif',
      files: [{ weight: 700, file: 'fonts/display.woff2' }],
      specimenWeight: 700,
      usage: 'Headlines',
      license: { name: 'OFL', allowsDownload: true }
    },
    text: {
      family: 'Fixture Text',
      fallback: 'sans-serif',
      files: [{ weight: 400, file: 'fonts/text.woff2' }],
      specimenWeight: 400,
      usage: 'Paragraphs',
      license: { name: 'Commercial', allowsDownload: false }
    }
  },
  typeScale: [
    { id: 'h1', name: 'Heading', font: 'display', weight: 700, sizePx: 48, lineHeight: 1.1, tracking: -0.01, usage: 'Titles' },
    { id: 'body', name: 'Body', font: 'text', weight: 400, sizePx: 16, lineHeight: 1.5, tracking: 0, usage: 'Paragraphs' }
  ],
  spacing: [
    { id: 'sm', px: 8, usage: 'Tight' },
    { id: 'lg', px: 32, usage: 'Loose' }
  ]
};
