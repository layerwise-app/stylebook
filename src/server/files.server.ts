// Serves /files/<key> from private Storage. The gate has already run by the time
// this is called, so the same code serves public and protected sites. Only keys
// in the manifest are served, so nothing else in Storage can be read this way.

import { env } from 'cloudflare:workers';
import { manifestFile } from '~/brand/manifest.server';
import { isSiteProtected } from './site-access.server';

export const FILES_PREFIX = '/files/';

function plain(status: number, message: string) {
  return new Response(message, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export async function serveBrandFile(request: Request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
  }
  const url = new URL(request.url);
  let key: string;
  try {
    key = decodeURIComponent(url.pathname.slice(FILES_PREFIX.length));
  } catch {
    return plain(404, 'Not found');
  }
  const file = manifestFile(key);
  if (!file) return plain(404, 'Not found');

  const etag = `"${file.sha256}"`;
  const headers = new Headers({
    'content-type': file.contentType,
    etag,
    'x-content-type-options': 'nosniff',
    // Revalidating keeps a changed password in force for cached files too.
    'cache-control': isSiteProtected() ? 'private, no-cache' : 'public, max-age=300'
  });
  if (file.format === 'SVG') {
    headers.set('content-security-policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }
  if (url.searchParams.has('download')) {
    const name = key.split('/').pop()!.replaceAll('"', '');
    headers.set('content-disposition', `attachment; filename="${name}"`);
  }
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers });
  }
  headers.set('content-length', String(file.size));
  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers });
  }

  const object = await env.STORAGE.get(key);
  if (!object) {
    console.error(`${key} is listed in the manifest but missing from Storage.`);
    return plain(404, 'This file has not been synced yet.');
  }
  return new Response(object.body, { status: 200, headers });
}
