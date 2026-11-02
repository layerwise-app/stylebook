// The Worker's front door: every request that isn't a static asset comes through
// here, so the password gate can't be skipped by any route or server function.

import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import { createServerEntry } from '@tanstack/react-start/server-entry';
import { FILES_PREFIX, serveBrandFile } from './server/files.server';
import { runGate } from './server/gate.server';
import { databaseLimiter } from './server/rate-limit.server';
import { sitePassword } from './server/site-access.server';

const startHandler = createStartHandler(defaultStreamHandler);

export default createServerEntry({
  async fetch(request) {
    // Dead code in production builds: Vite replaces DEV with false and the sync
    // module is dropped, so the route doesn't exist there at all.
    if (import.meta.env.DEV) {
      const { handleDevSync, isDevSyncRequest } = await import('./dev/sync.server');
      if (isDevSyncRequest(request)) return handleDevSync(request);
    }

    return runGate(request, {
      password: sitePassword(),
      limiter: databaseLimiter,
      next: () =>
        new URL(request.url).pathname.startsWith(FILES_PREFIX)
          ? serveBrandFile(request)
          : startHandler(request)
    });
  }
});
