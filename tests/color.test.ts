import { describe, expect, it } from 'vitest';
import {
  colorDistance,
  contrastRatio,
  formatColor,
  formatRatio,
  hexToRgb,
  mixColors,
  normalizeHex,
  oklabToRgb,
  readableOn,
  rgbToHex,
  rgbToHsl,
  rgbToOklab,
  rgbToOklch,
  softestReadable,
  wcagLevel
} from '../src/lib/color';

describe('hex parsing', () => {
  it('normalizes short and lowercase forms', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC');
    expect(normalizeHex('d94f2b')).toBe('#D94F2B');
  });
  it('rejects anything that is not a hex color', () => {
    expect(() => normalizeHex('#12345')).toThrow();
    expect(() => normalizeHex('red')).toThrow();
    expect(() => normalizeHex('#GGGGGG')).toThrow();
  });
  it('round-trips through rgb', () => {
    for (const hex of ['#000000', '#FFFFFF', '#123456', '#D94F2B']) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });
});

describe('format conversion against reference values', () => {
  it('converts primaries to the published CSS values', () => {
    expect(formatColor('#FF0000')).toEqual({
      hex: '#FF0000',
      rgb: 'rgb(255, 0, 0)',
      hsl: 'hsl(0, 100%, 50%)',
      oklch: 'oklch(0.628 0.258 29.2)'
    });
    expect(formatColor('#00FF00').oklch).toBe('oklch(0.866 0.295 142.5)');
    expect(formatColor('#0000FF').oklch).toBe('oklch(0.452 0.313 264.1)');
  });
  it('gives neutrals zero chroma and hue', () => {
    expect(formatColor('#FFFFFF').oklch).toBe('oklch(1 0 0)');
    expect(formatColor('#000000').oklch).toBe('oklch(0 0 0)');
    expect(rgbToOklch(hexToRgb('#808080')).c).toBe(0);
    expect(formatColor('#808080').hsl).toBe('hsl(0, 0%, 50%)');
  });
  it('matches known HSL values across every hue sector', () => {
    const cases: [string, [number, number, number]][] = [
      ['#FFFF00', [60, 100, 50]],
      ['#00FFFF', [180, 100, 50]],
      ['#FF00FF', [300, 100, 50]],
      ['#336699', [210, 50, 40]],
      ['#996633', [30, 50, 40]]
    ];
    for (const [hex, [h, s, l]] of cases) {
      const hsl = rgbToHsl(hexToRgb(hex));
      expect(hsl.h).toBeCloseTo(h, 5);
      expect(hsl.s).toBeCloseTo(s, 5);
      expect(hsl.l).toBeCloseTo(l, 5);
    }
  });
  it('never returns a negative hue', () => {
    expect(rgbToHsl(hexToRgb('#FF0080')).h).toBeGreaterThan(0);
    expect(rgbToOklch(hexToRgb('#FF0080')).h).toBeGreaterThan(0);
  });
  it('round-trips through OKLab', () => {
    for (const hex of ['#D94F2B', '#14505C', '#DDE36B', '#123456']) {
      expect(rgbToHex(oklabToRgb(rgbToOklab(hexToRgb(hex))))).toBe(hex);
    }
  });
});

describe('WCAG contrast', () => {
  it('matches reference ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#FF0000', '#FFFFFF')).toBeCloseTo(4.0, 2);
    expect(contrastRatio('#0000FF', '#FFFFFF')).toBeCloseTo(8.59, 2);
  });
  it('is symmetric', () => {
    expect(contrastRatio('#123456', '#FEDCBA')).toBe(
      contrastRatio('#FEDCBA', '#123456')
    );
  });
  it('labels thresholds exactly', () => {
    expect(wcagLevel(7)).toBe('AAA');
    expect(wcagLevel(6.99)).toBe('AA');
    expect(wcagLevel(4.5)).toBe('AA');
    expect(wcagLevel(4.499)).toBe('AA Large');
    expect(wcagLevel(3)).toBe('AA Large');
    expect(wcagLevel(2.99)).toBe('Fail');
  });
  it('never rounds a failing ratio up to a passing display value', () => {
    expect(formatRatio(4.499)).toBe('4.49');
    expect(formatRatio(21)).toBe('21.00');
  });
});

describe('readableOn', () => {
  const ink = '#101820';
  const paper = '#FAFAFA';
  it('keeps the preferred color when it passes', () => {
    expect(readableOn(paper, '#0000FF', ink, paper)).toBe('#0000FF');
  });
  it('falls back to the nearest passing of ink or paper', () => {
    // Yellow on near-white fails; only ink passes.
    expect(readableOn(paper, '#FFE600', ink, paper)).toBe(ink);
    // Yellow on near-black passes unchanged.
    expect(readableOn(ink, '#FFE600', ink, paper)).toBe('#FFE600');
    // Navy on near-black fails; only paper passes.
    expect(readableOn(ink, '#102040', ink, paper)).toBe(paper);
  });
  it('uses black or white when neither ink nor paper passes', () => {
    const midInk = '#606060';
    const midPaper = '#A0A0A0';
    const picked = readableOn('#808080', '#808080', midInk, midPaper);
    expect(['#000000', '#FFFFFF']).toContain(picked);
    expect(contrastRatio(picked, '#808080')).toBeGreaterThanOrEqual(4.5);
  });
  it('always reaches 4.5:1 on a sweep of backgrounds', () => {
    for (let r = 0; r <= 255; r += 51) {
      for (let g = 0; g <= 255; g += 51) {
        for (let b = 0; b <= 255; b += 51) {
          const bg = rgbToHex({ r, g, b });
          const text = readableOn(bg, '#D94F2B', '#7A7A7A', '#8A8A8A');
          expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});

describe('mixing helpers', () => {
  it('returns the endpoints', () => {
    expect(mixColors('#102030', '#F0E0D0', 0)).toBe('#102030');
    expect(mixColors('#102030', '#F0E0D0', 1)).toBe('#F0E0D0');
  });
  it('measures distance as zero for identical colors', () => {
    expect(colorDistance('#D94F2B', '#d94f2b')).toBe(0);
  });
  it('softens toward the background without breaking the ratio', () => {
    const soft = softestReadable('#000000', '#FFFFFF');
    expect(soft).not.toBe('#000000');
    expect(contrastRatio(soft, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
