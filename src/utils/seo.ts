import type { GuideView } from '~/brand/view';
import { siteUrl } from '~/lib/site';

type JsonLd = { [key: string]: unknown };

export type SeoOptions = {
  /** Brand details from getGuide. Absent before brand data is available. */
  guide?: GuideView;
  title: string;
  description?: string;
  /** This page's path, like `/logo`. Sets its canonical URL and `og:url`. */
  path?: string;
  type?: 'website' | 'article';
  /** Keeps the page out of search results. */
  noindex?: boolean;
  /** schema.org structured data. */
  jsonLd?: JsonLd | JsonLd[];
};

/**
 * Head tags for a route. Password protection overrides everything: the page is
 * noindex, with no canonical, share image, or structured data.
 */
export function seo({
  guide,
  title,
  description,
  path,
  type = 'website',
  noindex = false,
  jsonLd
}: SeoOptions) {
  const hidden = noindex || !guide || guide.protected;
  const url = path && !hidden ? siteUrl(path) : undefined;
  const imageUrl = !hidden ? siteUrl(guide.shareImage) : undefined;

  const meta = [
    { title },
    ...(description ? [{ name: 'description', content: description }] : []),
    ...(hidden ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
    // Open Graph consumers (Instagram, Facebook, iMessage, WhatsApp) read
    // `property`, not `name`, and need absolute URLs.
    ...(!hidden
      ? [
          { property: 'og:type', content: type },
          { property: 'og:site_name', content: guide.name },
          { property: 'og:title', content: title },
          ...(description ? [{ property: 'og:description', content: description }] : []),
          ...(url ? [{ property: 'og:url', content: url }] : []),
          ...(imageUrl
            ? [
                { property: 'og:image', content: imageUrl },
                { property: 'og:image:width', content: '1200' },
                { property: 'og:image:height', content: '630' },
                { property: 'og:image:alt', content: `${guide.name}: ${guide.tagline}` },
                { name: 'twitter:image', content: imageUrl }
              ]
            : []),
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: title },
          ...(description ? [{ name: 'twitter:description', content: description }] : [])
        ]
      : [])
  ];

  const links = url ? [{ rel: 'canonical', href: url }] : [];

  const scripts = (jsonLd && !hidden ? [jsonLd].flat() : []).map((data) => ({
    type: 'application/ld+json',
    // Escape `<` so a value can't close the script tag.
    children: JSON.stringify(data).replaceAll('<', '\\u003c')
  }));

  return { meta, links, scripts };
}

/** Head for one of the guide's pages, using the root route's brand data. */
export function pageHead(
  matches: readonly { loaderData?: unknown; routeId?: string }[],
  path: string,
  pageTitle: string
) {
  const guide = matches[0]?.loaderData as GuideView | undefined;
  return seo({
    guide,
    title: guide ? `${pageTitle} | ${guide.name} brand guidelines` : pageTitle,
    description: guide?.pages[path]?.description,
    path
  });
}
