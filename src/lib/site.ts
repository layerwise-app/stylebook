import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestUrl } from '@tanstack/react-start/server';

// Site settings that aren't brand content. This file reaches the browser, so the
// brand's name and share image live in the config and arrive through getGuide.
export const site = {
  /**
   * The address search engines should index, like `https://example.com`. Empty
   * uses the address each visitor opened. Set it when a custom domain is
   * connected, so the layerwise.site address isn't indexed as a copy.
   */
  url: '',
  /** The `content` of Google Search Console's HTML tag, if it's used. */
  googleSiteVerification: ''
};

/** Public pages in `/sitemap.xml`. Protected sites serve an empty sitemap. */
export const sitemapPaths: string[] = [
  '/',
  '/logo',
  '/color',
  '/typography',
  '/imagery',
  '/voice',
  '/applications',
  '/tokens',
  '/downloads',
  '/changelog',
  '/sheet'
];

const requestOrigin = createIsomorphicFn()
  .server(() => getRequestUrl().origin)
  .client(() => window.location.origin);

/** Absolute URL for a path on this site. */
export function siteUrl(path = '/'): string {
  return new URL(path, site.url || requestOrigin()).toString();
}
