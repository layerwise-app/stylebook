import { describe, expect, it } from 'vitest';
import { searchScore } from '../src/components/guide/SearchDialog';

describe('section and color search', () => {
  const color = { value: 'Lagoon #123456 color-lagoon', keywords: ['Quiet fields, charts, and clear labels'] };
  const section = { value: 'Clear space Logo clear-space', keywords: ['Logo'] };

  it('does not fuzzy-match letters scattered through long keywords', () => {
    expect(searchScore(color.value, 'clear space', color.keywords)).toBe(0);
  });
  it('finds a section by its title', () => {
    expect(searchScore(section.value, 'clear space', section.keywords)).toBe(1);
  });
  it('ranks a title match above a keyword match', () => {
    expect(searchScore(section.value, 'clear', section.keywords)).toBeGreaterThan(
      searchScore(color.value, 'clear', color.keywords)
    );
  });
  it('finds a color by name, hex, or a word from its keywords', () => {
    expect(searchScore(color.value, 'lagoon', color.keywords)).toBe(1);
    expect(searchScore(color.value, '#123456', color.keywords)).toBeGreaterThan(0);
    expect(searchScore(color.value, 'charts', color.keywords)).toBeGreaterThan(0);
  });
  it('shows everything for an empty query and nothing for a miss', () => {
    expect(searchScore(color.value, '  ', color.keywords)).toBe(1);
    expect(searchScore(color.value, 'zzzz', color.keywords)).toBe(0);
  });
});
