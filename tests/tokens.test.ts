import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/lib/color';
import {
  assertThemeReadable,
  fontFaceCss,
  resolveTheme,
  themeCss
} from '../src/lib/theme';
import { tokensCss, tokensJson, tokensTailwind } from '../src/lib/tokens';
import { fixture } from './fixture';

describe('CSS variables', () => {
  const css = tokensCss(fixture);
  it('emits every color, in canonical hex', () => {
    expect(css).toContain('--color-night: #101820;');
    expect(css).toContain('--color-chalk: #FAFAFA;');
    expect(css).toContain('--color-lemon: #FFE600;');
  });
  it('emits fonts, including a system stack when no mono font is set', () => {
    expect(css).toContain('--font-display: "Fixture Display", Georgia');
    expect(css).toContain('--font-mono: ui-monospace');
  });
  it('emits the type scale in rem with its role font', () => {
    expect(css).toContain('--type-h1-size: 3rem;');
    expect(css).toContain('--type-h1-font: var(--font-display);');
    expect(css).toContain('--type-body-line-height: 1.5;');
    expect(css).toContain('--type-h1-tracking: -0.01em;');
  });
  it('emits spacing', () => {
    expect(css).toContain('--space-sm: 8px;');
    expect(css).toContain('--space-lg: 32px;');
  });
  it('names the configured brand and nothing else', () => {
    expect(css.split('\n')[0]).toContain('Fixture Co');
  });
});

describe('Tailwind theme', () => {
  const css = tokensTailwind(fixture);
  it('is a v4 @theme block using Tailwind namespaces', () => {
    expect(css).toContain('@theme {');
    expect(css).toContain('--color-lemon: #FFE600;');
    expect(css).toContain('--text-h1: 3rem;');
    expect(css).toContain('--text-h1--line-height: 1.1;');
    expect(css).toContain('--spacing-lg: 32px;');
  });
  it('has balanced braces', () => {
    expect(css.match(/{/g)?.length).toBe(css.match(/}/g)?.length);
  });
});

describe('JSON tokens', () => {
  const json = JSON.parse(tokensJson(fixture));
  it('parses and uses DTCG fields', () => {
    expect(json.color.lemon.$type).toBe('color');
    expect(json.color.lemon.$value).toBe('#FFE600');
    expect(json.space.lg.$value).toBe('32px');
    expect(json.type.h1.$value.fontFamily).toBe('{font.display}');
  });
  it('carries computed formats', () => {
    expect(json.color.lemon.$extensions.rgb).toBe('rgb(255, 230, 0)');
    expect(json.color.lemon.$extensions.oklch).toMatch(/^oklch\(/);
  });
  it('includes CMYK and Pantone only when the config provides them', () => {
    expect(json.color.lemon.$extensions.pantone).toBe('PANTONE Yellow C');
    expect(json.color.night.$extensions.pantone).toBeUndefined();
    expect(json.color.night.$extensions.cmyk).toBeUndefined();
  });
});

describe('generators follow the config', () => {
  it('changes output when a color changes, leaving no old value behind', () => {
    const swapped = {
      ...fixture,
      colors: fixture.colors.map((c) =>
        c.id === 'lemon' ? { ...c, hex: '#00AA55' } : c
      )
    };
    for (const generate of [tokensCss, tokensTailwind, tokensJson]) {
      const out = generate(swapped);
      expect(out).toContain('#00AA55');
      expect(out).not.toContain('#FFE600');
    }
  });
  it('is deterministic', () => {
    expect(tokensJson(fixture)).toBe(tokensJson(fixture));
    expect(tokensCss(fixture)).toBe(tokensCss(fixture));
  });
});

describe('theme', () => {
  it('rejects a palette with a missing role', () => {
    expect(() => resolveTheme(fixture.colors.slice(0, 2))).toThrow(/role/);
  });
  it('uses ink rather than a brand color that fails on paper', () => {
    const theme = resolveTheme(fixture.colors);
    expect(theme.link).toBe('#101820');
    expect(theme.brand.text).toBe('#101820');
  });
  it('holds 4.5:1 on every surface across awkward palettes', () => {
    const awkward = [
      ['#777777', '#888888', '#808080'],
      ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
      ['#000000', '#000000', '#000000'],
      ['#FFE600', '#FFF4A0', '#FFEE00'],
      ['#F4F4F4', '#111111', '#FF00AA'],
      ['#3355FF', '#FF3355', '#33FF55']
    ];
    for (const [ink, paper, brand] of awkward) {
      const theme = resolveTheme([
        { ...fixture.colors[0], hex: ink },
        { ...fixture.colors[1], hex: paper },
        { ...fixture.colors[2], hex: brand }
      ]);
      expect(() => assertThemeReadable(theme)).not.toThrow();
      expect(contrastRatio(theme.link, theme.paper.background)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('writes CSS variables from the type scale, with defaults for missing roles', () => {
    const css = themeCss(fixture);
    expect(css).toContain('--sb-h1-max:48px');
    expect(css).toContain('--sb-display-max:112px');
    expect(css).toContain('--sb-paper:#FAFAFA');
  });
  it('resolves layout spacing to the nearest brand step', () => {
    const css = themeCss(fixture);
    expect(css).toContain('--sb-space-1:8px');
    expect(css).toContain('--sb-space-10:32px');
  });
  it('points font faces at access-checked files', () => {
    const css = fontFaceCss(fixture);
    expect(css).toContain('url("/files/fonts/display.woff2") format("woff2")');
    expect(css).toContain('font-weight:700');
  });
});
