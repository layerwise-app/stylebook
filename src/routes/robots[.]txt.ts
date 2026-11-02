import { createFileRoute } from '@tanstack/react-router';
import { siteUrl } from '~/lib/site';
import { isSiteProtected } from '~/server/site-access.server';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const lines = isSiteProtected()
          ? ['User-agent: *', 'Disallow: /', '']
          : ['User-agent: *', 'Allow: /', '', `Sitemap: ${siteUrl('/sitemap.xml')}`, ''];
        return new Response(lines.join('\n'), {
          headers: { 'content-type': 'text/plain; charset=utf-8' }
        });
      }
    }
  }
});
