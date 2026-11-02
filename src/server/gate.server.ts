// Runs before anything else on every request. With no password the site is
// public and requests pass straight through. With one, nothing beyond the locked
// page, robots.txt, and an empty sitemap is reachable without the unlock cookie.

import { gatePageHtml, type GateMessage } from './gate-page.server';
import type { AttemptLimiter } from './rate-limit.server';
import {
  COOKIE_NAME,
  createUnlockValue,
  hashClientKey,
  isUnlockValueValid,
  passwordMatches,
  readCookie,
  unlockCookieHeader
} from './unlock.server';

export const UNLOCK_PATH = '/unlock';
/** Reachable while locked. Their handlers serve nothing but "stay out". */
const OPEN_WHILE_LOCKED = new Set(['/robots.txt', '/sitemap.xml']);

const MAX_FORM_BYTES = 4096;

export type GateOptions = {
  /** Empty when SITE_PASSWORD is unset. */
  password: string;
  limiter: AttemptLimiter;
  next: () => Promise<Response> | Response;
};

const NOINDEX = 'noindex, nofollow';

function lockedHeaders(extra?: Record<string, string>) {
  return {
    'x-robots-tag': NOINDEX,
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer',
    ...extra
  };
}

function gatePage(status: number, message: GateMessage, next: string, extra?: Record<string, string>) {
  return new Response(gatePageHtml(message, next), {
    status,
    headers: lockedHeaders({
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy':
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'",
      ...extra
    })
  });
}

/** Only same-origin paths, so the form can't be used as an open redirect. */
export function safeNextPath(value: unknown) {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value.length > 2000 ? '/' : value;
}

function wantsPage(request: Request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const destination = request.headers.get('sec-fetch-dest');
  if (destination) return destination === 'document';
  return (request.headers.get('accept') ?? '').includes('text/html');
}

function clientAddress(request: Request) {
  // Set by Cloudflare and not forgeable by the client there. It's absent in the
  // local preview, where every try shares one bucket.
  return request.headers.get('cf-connecting-ip') ?? 'local';
}

async function handleUnlock(request: Request, password: string, limiter: AttemptLimiter) {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_FORM_BYTES) {
    return new Response('Too large', { status: 413, headers: lockedHeaders() });
  }
  const form = await request.formData().catch(() => null);
  const guess = form?.get('password');
  const next = safeNextPath(form?.get('next'));
  if (typeof guess !== 'string' || !guess) {
    return gatePage(400, 'wrong', next);
  }

  const clientKey = await hashClientKey(clientAddress(request), password);
  // The try is counted before the password is looked at. Over the limit, even
  // the right password gets the same answer.
  const attempt = await limiter.consume(clientKey);
  if (!attempt.allowed) {
    return gatePage(429, 'limited', next, {
      'retry-after': String(attempt.retryAfterSeconds)
    });
  }
  if (!(await passwordMatches(guess, password))) {
    return gatePage(401, 'wrong', next);
  }

  await limiter.clear(clientKey);
  return new Response(null, {
    status: 303,
    headers: lockedHeaders({
      location: next,
      'set-cookie': unlockCookieHeader(await createUnlockValue(password))
    })
  });
}

function withPrivateHeaders(response: Response) {
  const result = new Response(response.body, response);
  result.headers.set('x-robots-tag', NOINDEX);
  result.headers.set('cache-control', 'private, no-cache');
  result.headers.append('vary', 'Cookie');
  result.headers.set('referrer-policy', 'no-referrer');
  return result;
}

export async function runGate(request: Request, options: GateOptions): Promise<Response> {
  const { password, limiter, next } = options;
  if (!password) return next();

  const url = new URL(request.url);

  if (url.pathname === UNLOCK_PATH) {
    if (request.method === 'POST') {
      try {
        return await handleUnlock(request, password, limiter);
      } catch (error) {
        // Fail closed: without the limiter, no password is checked.
        console.error('Password check failed', error);
        return gatePage(503, 'limited', '/');
      }
    }
    return gatePage(401, 'none', '/');
  }

  if (OPEN_WHILE_LOCKED.has(url.pathname)) {
    return withPrivateHeaders(await next());
  }

  const cookie = readCookie(request, COOKIE_NAME);
  if (await isUnlockValueValid(cookie, password)) {
    return withPrivateHeaders(await next());
  }

  if (wantsPage(request)) {
    return gatePage(401, 'none', safeNextPath(url.pathname + url.search));
  }
  return new Response('Locked', {
    status: 401,
    headers: lockedHeaders({ 'content-type': 'text/plain; charset=utf-8' })
  });
}
