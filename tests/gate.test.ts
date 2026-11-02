import { describe, expect, it, vi } from 'vitest';
import { runGate, safeNextPath } from '../src/server/gate.server';
import type { AttemptLimiter } from '../src/server/rate-limit.server';
import {
  COOKIE_MAX_AGE_SECONDS,
  COOKIE_NAME,
  createUnlockValue,
  hashClientKey,
  isUnlockValueValid,
  passwordMatches,
  readCookie,
  unlockCookieHeader
} from '../src/server/unlock.server';

const PASSWORD = 'correct horse';

function memoryLimiter(max = 5): AttemptLimiter & { counts: Map<string, number> } {
  const counts = new Map<string, number>();
  return {
    counts,
    async consume(key) {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return { allowed: count <= max, retryAfterSeconds: 900 };
    },
    async clear(key) {
      counts.delete(key);
    }
  };
}

const page = () => new Response('<html>secret brand page</html>', { status: 200 });

const pageRequest = (path = '/', headers: Record<string, string> = {}) =>
  new Request(`https://site.test${path}`, {
    headers: { accept: 'text/html', 'sec-fetch-dest': 'document', ...headers }
  });

function tryPassword(password: string, ip = '203.0.113.9', next = '/logo') {
  const body = new URLSearchParams({ password, next });
  return new Request('https://site.test/unlock', {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'cf-connecting-ip': ip
    }
  });
}

describe('password check', () => {
  it('matches only the exact password', async () => {
    expect(await passwordMatches(PASSWORD, PASSWORD)).toBe(true);
    expect(await passwordMatches('correct hors', PASSWORD)).toBe(false);
    expect(await passwordMatches('', PASSWORD)).toBe(false);
    expect(await passwordMatches(`${PASSWORD} `, PASSWORD)).toBe(false);
  });
});

describe('unlock cookie', () => {
  it('accepts its own value', async () => {
    expect(await isUnlockValueValid(await createUnlockValue(PASSWORD), PASSWORD)).toBe(true);
  });
  it('stops working when the password changes', async () => {
    const value = await createUnlockValue(PASSWORD);
    expect(await isUnlockValueValid(value, 'new password')).toBe(false);
  });
  it('expires after 30 days', async () => {
    const now = Date.UTC(2026, 0, 1);
    const value = await createUnlockValue(PASSWORD, now);
    const justBefore = now + (COOKIE_MAX_AGE_SECONDS - 1) * 1000;
    const atExpiry = now + COOKIE_MAX_AGE_SECONDS * 1000;
    expect(await isUnlockValueValid(value, PASSWORD, justBefore)).toBe(true);
    expect(await isUnlockValueValid(value, PASSWORD, atExpiry)).toBe(false);
  });
  it('cannot have its expiry extended without the password', async () => {
    const value = await createUnlockValue(PASSWORD);
    const [, signature] = value.split('.');
    expect(await isUnlockValueValid(`9999999999.${signature}`, PASSWORD)).toBe(false);
  });
  it('rejects junk', async () => {
    for (const junk of [undefined, '', 'yes', '.', '123.', `999.${'a'.repeat(43)}`]) {
      expect(await isUnlockValueValid(junk, PASSWORD)).toBe(false);
    }
  });
  it('sets every required attribute', () => {
    const header = unlockCookieHeader('v');
    for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=2592000']) {
      expect(header).toContain(attribute);
    }
  });
  it('reads the right cookie out of several', () => {
    const request = new Request('https://site.test', {
      headers: { cookie: `a=1; ${COOKIE_NAME}=abc.def; z=9` }
    });
    expect(readCookie(request, COOKIE_NAME)).toBe('abc.def');
    expect(readCookie(request, 'missing')).toBeUndefined();
  });
});

describe('client key', () => {
  it('hides the address and differs per client', async () => {
    const key = await hashClientKey('203.0.113.9', PASSWORD);
    expect(key).not.toContain('203');
    expect(await hashClientKey('203.0.113.10', PASSWORD)).not.toBe(key);
  });
});

describe('next path', () => {
  it('blocks open redirects', () => {
    expect(safeNextPath('/logo?x=1')).toBe('/logo?x=1');
    for (const bad of ['//evil.test', 'https://evil.test', '/\\evil.test', 'logo', 5, null]) {
      expect(safeNextPath(bad)).toBe('/');
    }
  });
});

describe('gate with no password', () => {
  it('passes everything straight through', async () => {
    const next = vi.fn(page);
    const response = await runGate(pageRequest('/logo'), { password: '', limiter: memoryLimiter(), next });
    expect(next).toHaveBeenCalledOnce();
    expect(await response.text()).toContain('secret brand page');
    expect(response.headers.get('x-robots-tag')).toBeNull();
  });
});

describe('gate with a password', () => {
  const options = (limiter = memoryLimiter()) => ({ password: PASSWORD, limiter, next: vi.fn(page) });

  it('shows the neutral page instead of any route', async () => {
    const o = options();
    const response = await runGate(pageRequest('/color'), o);
    const html = await response.text();
    expect(o.next).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(html).toContain('type="password"');
    expect(html).not.toContain('secret');
    expect(html).not.toMatch(/<link|<script|<img|og:/);
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('blocks server functions and files with a bare 401', async () => {
    for (const path of ['/_serverFn/anything', '/files/generated/brand-assets.zip']) {
      const o = options();
      const request = new Request(`https://site.test${path}`, {
        method: path.startsWith('/_') ? 'POST' : 'GET',
        headers: { 'sec-fetch-dest': 'empty', accept: '*/*' }
      });
      const response = await runGate(request, o);
      expect(o.next).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Locked');
    }
  });

  it('lets robots.txt and the sitemap through with private headers', async () => {
    for (const path of ['/robots.txt', '/sitemap.xml']) {
      const o = options();
      const response = await runGate(new Request(`https://site.test${path}`), o);
      expect(o.next).toHaveBeenCalledOnce();
      expect(response.headers.get('x-robots-tag')).toContain('noindex');
      expect(response.headers.get('cache-control')).toContain('private');
    }
  });

  it('rejects a wrong password', async () => {
    const response = await runGate(tryPassword('wrong'), options());
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.text()).toContain('didn’t work');
  });

  it('unlocks with the right password and sends the visitor on', async () => {
    const response = await runGate(tryPassword(PASSWORD), options());
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/logo');
    const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toContain(`${COOKIE_NAME}=`);
    const value = cookie.split(';')[0]!.split('=')[1];
    expect(await isUnlockValueValid(value, PASSWORD)).toBe(true);
  });

  it('never redirects off-site after unlocking', async () => {
    const response = await runGate(tryPassword(PASSWORD, '198.51.100.7', '//evil.test'), options());
    expect(response.headers.get('location')).toBe('/');
  });

  it('serves pages once unlocked, with private caching and noindex', async () => {
    const o = options();
    const value = await createUnlockValue(PASSWORD);
    const response = await runGate(pageRequest('/', { cookie: `${COOKIE_NAME}=${value}` }), o);
    expect(o.next).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
  });

  it('blocks a cookie from an old password', async () => {
    const o = options();
    const value = await createUnlockValue('old password');
    const response = await runGate(pageRequest('/', { cookie: `${COOKIE_NAME}=${value}` }), o);
    expect(o.next).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('allows 5 tries, then refuses even the right password', async () => {
    const limiter = memoryLimiter();
    for (let i = 0; i < 5; i++) {
      expect((await runGate(tryPassword('wrong'), options(limiter))).status).toBe(401);
    }
    const blocked = await runGate(tryPassword('wrong'), options(limiter));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toBe('900');
    const right = await runGate(tryPassword(PASSWORD), options(limiter));
    expect(right.status).toBe(429);
    expect(right.headers.get('set-cookie')).toBeNull();
  });

  it('counts each client on its own', async () => {
    const limiter = memoryLimiter();
    for (let i = 0; i < 6; i++) await runGate(tryPassword('wrong', '192.0.2.1'), options(limiter));
    expect((await runGate(tryPassword(PASSWORD, '192.0.2.2'), options(limiter))).status).toBe(303);
  });

  it('stores only a hashed client key', async () => {
    const limiter = memoryLimiter();
    await runGate(tryPassword('wrong', '192.0.2.1'), options(limiter));
    expect([...limiter.counts.keys()].join()).not.toContain('192.0.2.1');
  });

  it('clears the count after a correct password', async () => {
    const limiter = memoryLimiter();
    for (let i = 0; i < 3; i++) await runGate(tryPassword('wrong'), options(limiter));
    await runGate(tryPassword(PASSWORD), options(limiter));
    expect(limiter.counts.size).toBe(0);
  });

  it('fails closed if the limiter is down', async () => {
    const down: AttemptLimiter = {
      consume: () => Promise.reject(new Error('database down')),
      clear: () => Promise.resolve()
    };
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await runGate(tryPassword(PASSWORD), options(down as never));
    silence.mockRestore();
    expect(response.status).toBe(503);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
