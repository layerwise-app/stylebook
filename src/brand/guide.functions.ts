import { createServerFn } from '@tanstack/react-start';
import { getRequest, setResponseStatus } from '@tanstack/react-start/server';
import { isSiteProtected, requestHasAccess } from '~/server/site-access.server';
import { getGuideView } from './guide.server';

/**
 * The one way brand content reaches the browser. The gate in src/server.ts has
 * already checked this request; the check repeats here so that content can't
 * leak if a code path ever bypasses the gate.
 */
export const getGuide = createServerFn({ method: 'GET' }).handler(async () => {
  if (!(await requestHasAccess(getRequest()))) {
    setResponseStatus(401);
    throw new Error('Locked');
  }
  let syncErrors: string[] | null = null;
  if (import.meta.env.DEV) {
    const { devSyncStatus } = await import('~/dev/sync.server');
    const errors = devSyncStatus()?.errors ?? [];
    syncErrors = errors.length ? errors : null;
  }
  return getGuideView(isSiteProtected(), syncErrors);
});
