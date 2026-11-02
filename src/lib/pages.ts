// The guide's structure. Generic labels only: brand content arrives at runtime
// through the access-checked getGuide server function.

export type PageSection = { id: string; title: string };
export type PageDef = {
  path: string;
  title: string;
  sections: PageSection[];
};

export const PAGES: PageDef[] = [
  {
    path: '/',
    title: 'Overview',
    sections: [
      { id: 'stands-for', title: 'What it stands for' },
      { id: 'quick-downloads', title: 'Quick downloads' },
      { id: 'last-updated', title: 'Last updated' }
    ]
  },
  {
    path: '/logo',
    title: 'Logo',
    sections: [
      { id: 'variants', title: 'Variants' },
      { id: 'clear-space', title: 'Clear space' },
      { id: 'minimum-size', title: 'Minimum size' },
      { id: 'misuse', title: 'Misuse' }
    ]
  },
  {
    path: '/color',
    title: 'Color',
    sections: [
      { id: 'palette', title: 'Palette' },
      { id: 'proportion', title: 'Proportion' },
      { id: 'contrast', title: 'Contrast' }
    ]
  },
  {
    path: '/typography',
    title: 'Typography',
    sections: [
      { id: 'typefaces', title: 'Typefaces' },
      { id: 'test-line', title: 'Test line' },
      { id: 'type-scale', title: 'Type scale' },
      { id: 'usage', title: 'Usage by role' }
    ]
  },
  {
    path: '/imagery',
    title: 'Imagery',
    sections: [
      { id: 'art-direction', title: 'Art direction' },
      { id: 'examples', title: 'Examples' }
    ]
  },
  {
    path: '/voice',
    title: 'Voice',
    sections: [
      { id: 'principles', title: 'Principles' },
      { id: 'write-this', title: 'Write this, avoid this' }
    ]
  },
  {
    path: '/applications',
    title: 'Applications',
    sections: [
      { id: 'social-post', title: 'Social post' },
      { id: 'packaging', title: 'Packaging' },
      { id: 'slide', title: 'Slide' },
      { id: 'business-card', title: 'Business card' },
      { id: 'poster', title: 'Poster' }
    ]
  },
  {
    path: '/tokens',
    title: 'Tokens',
    sections: [
      { id: 'formats', title: 'Formats' },
      { id: 'spacing', title: 'Spacing' }
    ]
  },
  {
    path: '/downloads',
    title: 'Downloads',
    sections: [
      { id: 'all-files', title: 'All files' },
      { id: 'by-group', title: 'Files by group' }
    ]
  },
  {
    path: '/changelog',
    title: 'Changelog',
    sections: [{ id: 'versions', title: 'Versions' }]
  }
];

export function pageByPath(path: string) {
  const page = PAGES.find((p) => p.path === path);
  if (!page) throw new Error(`Unknown page ${path}`);
  return page;
}

export function pageNumber(path: string) {
  return String(PAGES.findIndex((p) => p.path === path) + 1).padStart(2, '0');
}

export const SHEET_PATH = '/sheet';
