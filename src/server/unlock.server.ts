// Password and cookie primitives. Web Crypto only, with no Worker bindings, so
// they run under tests as they do in production.

export const COOKIE_NAME = 'site_unlock';
export const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const encoder = new TextEncoder();

async function hmacKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage
  );
}

function toBase64Url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

async function sign(secret: string, message: string) {
  const key = await hmacKey(secret, ['sign']);
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

/** Compares equal-length digests without stopping at the first difference. */
function digestsEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i]! ^ b[i]!;
  return difference === 0;
}

/**
 * Constant-time password check. Hashing first makes both inputs the same
 * length, so a guess's length and matching prefix don't affect the timing.
 */
export async function passwordMatches(guess: string, password: string) {
  const [a, b] = await Promise.all(
    [guess, password].map(async (value) =>
      new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
    )
  );
  return digestsEqual(a!, b!);
}

/** Cookie value: `<expiry>.<HMAC of expiry, keyed with the password>`. */
export async function createUnlockValue(password: string, nowMs = Date.now()) {
  const expires = Math.floor(nowMs / 1000) + COOKIE_MAX_AGE_SECONDS;
  return `${expires}.${await sign(password, String(expires))}`;
}

export async function isUnlockValueValid(
  value: string | undefined,
  password: string,
  nowMs = Date.now()
) {
  if (!value) return false;
  const match = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return false;
  const [, expires, signature] = match;
  if (Number(expires) <= Math.floor(nowMs / 1000)) return false;
  const expected = await sign(password, expires!);
  return digestsEqual(encoder.encode(signature), encoder.encode(expected));
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return undefined;
}

export function unlockCookieHeader(value: string) {
  return (
    `${COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; ` +
    'HttpOnly; Secure; SameSite=Lax'
  );
}

/**
 * The only form of the client address that is ever stored. Keyed with the
 * password because a plain hash of an IPv4 address is easy to reverse.
 */
export function hashClientKey(address: string, password: string) {
  return sign(password, `client:${address}`);
}
