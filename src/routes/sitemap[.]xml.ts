import { createFileRoute } from '@tanstack/react-router';
import { sitemapPaths, siteUrl } from '~/lib/site';
import { isSiteProtected } from '~/server/site-access.server';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const paths = isSiteProtected() ? [] : sitemapPaths;
        const urls = paths
          .map((path) => `  <url><loc>${escapeXml(siteUrl(path))}</loc></url>`)
          .join('\n');
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
          { headers: { 'content-type': 'application/xml; charset=utf-8' } }
        );
      }
    }
  }
});

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
