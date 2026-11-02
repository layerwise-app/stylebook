// Generates the three token formats. build-brand writes the results to
// brand-files/generated/tokens/ and the Tokens page renders them live; both call
// these functions with the same config, so the two can't drift apart.

import type { BrandConfig, TypeStep } from '../brand/types';
import { formatColor } from './color';
import { fontStack } from './theme';

export type TokenConfig = Pick<
  BrandConfig,
  'name' | 'colors' | 'fonts' | 'typeScale' | 'spacing'
>;

const px = (value: number) => `${value}px`;
const rem = (value: number) => `${Math.round((value / 16) * 10000) / 10000}rem`;
const fontVar = (font: TypeStep['font']) => `var(--font-${font})`;

const stacks = (config: TokenConfig) => ({
  display: fontStack(config.fonts.display),
  text: fontStack(config.fonts.text),
  mono: fontStack(config.fonts.mono)
});

export function tokensCss(config: TokenConfig): string {
  const lines = [
    `/* ${config.name} design tokens. Generated from the brand config. */`,
    ':root {',
    ...config.colors.map(
      (c) => `  --color-${c.id}: ${formatColor(c.hex).hex};`
    ),
    '',
    ...Object.entries(stacks(config)).map(
      ([role, stack]) => `  --font-${role}: ${stack};`
    ),
    '',
    ...config.typeScale.flatMap((step) => [
      `  --type-${step.id}-font: ${fontVar(step.font)};`,
      `  --type-${step.id}-weight: ${step.weight};`,
      `  --type-${step.id}-size: ${rem(step.sizePx)};`,
      `  --type-${step.id}-line-height: ${step.lineHeight};`,
      `  --type-${step.id}-tracking: ${step.tracking}em;`
    ]),
    '',
    ...config.spacing.map((s) => `  --space-${s.id}: ${px(s.px)};`),
    '}',
    ''
  ];
  return lines.join('\n');
}

/** A Tailwind CSS v4 `@theme` block. */
export function tokensTailwind(config: TokenConfig): string {
  const lines = [
    `/* ${config.name} theme for Tailwind CSS v4. Generated from the brand config. */`,
    '@theme {',
    ...config.colors.map(
      (c) => `  --color-${c.id}: ${formatColor(c.hex).hex};`
    ),
    '',
    ...Object.entries(stacks(config)).map(
      ([role, stack]) => `  --font-${role}: ${stack};`
    ),
    '',
    ...config.typeScale.flatMap((step) => [
      `  --text-${step.id}: ${rem(step.sizePx)};`,
      `  --text-${step.id}--line-height: ${step.lineHeight};`,
      `  --text-${step.id}--letter-spacing: ${step.tracking}em;`,
      `  --text-${step.id}--font-weight: ${step.weight};`
    ]),
    '',
    ...config.spacing.map((s) => `  --spacing-${s.id}: ${px(s.px)};`),
    '}',
    ''
  ];
  return lines.join('\n');
}

/** Design Tokens Community Group format. */
export function tokensJson(config: TokenConfig): string {
  const fonts = stacks(config);
  const tokens = {
    $description: `${config.name} design tokens. Generated from the brand config.`,
    color: Object.fromEntries(
      config.colors.map((c) => {
        const formats = formatColor(c.hex);
        return [
          c.id,
          {
            $type: 'color',
            $value: formats.hex,
            $description: c.usage,
            $extensions: {
              name: c.name,
              role: c.role,
              rgb: formats.rgb,
              hsl: formats.hsl,
              oklch: formats.oklch,
              ...(c.cmyk ? { cmyk: c.cmyk } : {}),
              ...(c.pantone ? { pantone: c.pantone } : {})
            }
          }
        ];
      })
    ),
    font: Object.fromEntries(
      Object.entries(fonts).map(([role, stack]) => [
        role,
        { $type: 'fontFamily', $value: stack }
      ])
    ),
    type: Object.fromEntries(
      config.typeScale.map((step) => [
        step.id,
        {
          $type: 'typography',
          $value: {
            fontFamily: `{font.${step.font}}`,
            fontWeight: step.weight,
            fontSize: px(step.sizePx),
            lineHeight: step.lineHeight,
            letterSpacing: `${step.tracking}em`
          },
          $description: step.usage
        }
      ])
    ),
    space: Object.fromEntries(
      config.spacing.map((s) => [
        s.id,
        { $type: 'dimension', $value: px(s.px), $description: s.usage }
      ])
    )
  };
  return `${JSON.stringify(tokens, null, 2)}\n`;
}
