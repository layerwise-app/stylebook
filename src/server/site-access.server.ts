import { env } from 'cloudflare:workers';
import { COOKIE_NAME, isUnlockValueValid, readCookie } from './unlock.server';

declare global {
  namespace Cloudflare {
    interface Env {
      /** Optional secret. Unset or empty means the site is public. */
      SITE_PASSWORD?: string;
    }
  }
}

export function sitePassword() {
  return env.SITE_PASSWORD ?? '';
}

export function isSiteProtected() {
  return sitePassword() !== '';
}

/** True when this request may see brand content. */
export async function requestHasAccess(request: Request) {
  const password = sitePassword();
  if (!password) return true;
  return isUnlockValueValid(readCookie(request, COOKIE_NAME), password);
}
