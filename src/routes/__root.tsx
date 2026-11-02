/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type * as React from 'react';
import { getGuide } from '~/brand/guide.functions';
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary';
import { NotFound } from '~/components/NotFound';
import { site } from '~/lib/site';
import { seo } from '~/utils/seo';
import '~/styles/app.css';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  // All brand content, and the theme, comes from this one access-checked call.
  // It's fetched once and kept for the visit.
  loader: () => getGuide(),
  staleTime: Infinity,
  head: ({ loaderData: guide }) => {
    const base = seo({
      guide,
      title: guide ? `${guide.name} brand guidelines` : 'Brand guidelines',
      description: guide?.description
    });
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        ...(guide ? [{ name: 'theme-color', content: guide.themeColor }] : []),
        ...(site.googleSiteVerification
          ? [{ name: 'google-site-verification', content: site.googleSiteVerification }]
          : []),
        ...base.meta
      ],
      links: guide
        ? [
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: guide.favicon },
            { rel: 'apple-touch-icon', href: guide.appleTouchIcon },
            ...guide.fontPreloads.map((href) => ({
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              href,
              crossOrigin: 'anonymous' as const
            }))
          ]
        : [{ rel: 'icon', href: '/favicon.ico' }],
      styles: guide ? [{ children: guide.themeCss }] : []
    };
  },
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  component: RootComponent
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
