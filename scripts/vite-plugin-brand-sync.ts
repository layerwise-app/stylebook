// When the local preview starts, and when brand-files/generated/manifest.json
// changes, uploads new and changed brand files to Storage by content hash and
// deletes ones no longer listed. Dev server only; it does nothing in a build.

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { hashBrandInputs } from './build-brand/inputs';
import type { BrandManifest } from '../src/lib/brand-files';

const MANIFEST = 'brand-files/generated/manifest.json';
const SYNC_PATH = '/__stylebook/sync';
const CONCURRENCY = 6;

// Vite reloads this module on every restart, but a sync already running would still
// hold the old token, so the token lives as long as the dev process.
const processState = globalThis as { __stylebookSyncToken?: string };

export function brandSync(): Plugin {
  const token = (processState.__stylebookSyncToken ??= randomBytes(24).toString('hex'));
  return {
    name: 'stylebook:brand-sync',
    apply: 'serve',
    config: () => ({
      define: { __BRAND_SYNC_TOKEN__: JSON.stringify(token) }
    }),
    configureServer(server) {
      const root = server.config.root;
      const manifestPath = join(root, MANIFEST);
      let running = false;
      let again = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const run = async () => {
        if (running) {
          again = true;
          return;
        }
        running = true;
        try {
          await syncBrandFiles(server, root, token);
        } catch (error) {
          server.config.logger.error(
            `[brand sync] ${error instanceof Error ? error.message : String(error)}`
          );
        }
        running = false;
        if (again) {
          again = false;
          void run();
        }
      };

      server.httpServer?.once('listening', () => void run());
      server.watcher.add(manifestPath);
      server.watcher.on('change', (path) => {
        if (path !== manifestPath) return;
        clearTimeout(timer);
        timer = setTimeout(() => void run(), 400);
      });

      // The Cloudflare plugin restarts when .dev.vars changes, but not when it's
      // created or deleted, which is how the README turns the password on and off.
      const devVars = join(root, '.dev.vars');
      const restartOnDevVars = (path: string) => {
        if (path === devVars) void server.restart();
      };
      server.watcher.on('add', restartOnDevVars);
      server.watcher.on('unlink', restartOnDevVars);
    }
  };
}

async function waitForWorker(base: string, token: string) {
  const deadline = Date.now() + 60_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      // An empty plan is harmless: it tells us the Worker is up.
      const response = await fetch(`${base}${SYNC_PATH}/plan`, {
        method: 'POST',
        headers: { 'x-sync-token': token, 'content-type': 'application/json' },
        body: JSON.stringify({ files: [] })
      });
      if (response.ok) return;
      lastError = new Error(`${response.status} ${await response.text()}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`The preview's Worker never answered: ${String(lastError)}`);
}

async function syncBrandFiles(server: ViteDevServer, root: string, token: string) {
  const logger = server.config.logger;
  const manifestPath = join(root, MANIFEST);
  if (!existsSync(manifestPath)) {
    throw new Error('No manifest found. Run `pnpm build-brand` first.');
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BrandManifest;
  const errors: string[] = [];
  if (manifest.inputHash !== hashBrandInputs(root)) {
    const message =
      'The brand config or source files changed since the last build. Run `pnpm build-brand` to regenerate brand-files/generated/.';
    logger.warn(`[brand sync] ${message}`);
    errors.push(message);
  }

  const base =
    server.resolvedUrls?.local[0]?.replace(/\/$/, '') ??
    `http://127.0.0.1:${server.config.server.port}`;
  await waitForWorker(base, token);

  // The Worker can reload mid-sync when generated files change, which shows up as
  // a dropped connection or an empty 5xx, so each step gets a few tries.
  const call = async (step: string, init: RequestInit) => {
    let last: Response | undefined;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      try {
        last = await fetch(`${base}${SYNC_PATH}/${step}`, {
          method: 'POST',
          ...init,
          headers: { 'x-sync-token': token, ...init.headers }
        });
        if (last.status < 500 || last.status === 502) return last;
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
    return last!;
  };

  const planResponse = await call('plan', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      files: manifest.files.map(({ key, sha256, size, contentType }) => ({
        key,
        sha256,
        size,
        contentType
      }))
    })
  });
  if (!planResponse.ok) {
    throw new Error(`Sync plan failed: ${await planResponse.text()}`);
  }
  const plan = (await planResponse.json()) as {
    upload: string[];
    remove: string[];
    messages: string[];
    readOnly: boolean;
    total: number;
  };
  errors.push(...plan.messages);
  if (plan.readOnly) {
    errors.push('Project Storage is over its quota, so new files can’t be uploaded.');
  }

  const byKey = new Map(manifest.files.map((f) => [f.key, f]));
  const queue = [...plan.upload];
  let uploaded = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let key = queue.shift(); key; key = queue.shift()) {
        const file = byKey.get(key)!;
        const path = join(root, 'brand-files', key);
        if (!existsSync(path)) {
          errors.push(`brand-files/${key} is in the manifest but missing. Run \`pnpm build-brand\`.`);
          continue;
        }
        const response = await call(`upload?key=${encodeURIComponent(key)}`, {
          headers: { 'content-type': file.contentType, 'x-sha256': file.sha256 },
          body: readFileSync(path)
        });
        if (response.ok) {
          uploaded++;
        } else {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          errors.push(body?.error ?? `brand-files/${key} failed to upload (${response.status}).`);
        }
      }
    })
  );

  const unchanged = plan.total - plan.upload.length - plan.messages.length;
  const finish = await call('finish', {
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ remove: plan.remove, errors, uploaded, unchanged })
  });
  if (!finish.ok) throw new Error(`Sync cleanup failed: ${await finish.text()}`);

  for (const error of errors) logger.error(`[brand sync] ${error}`);
  logger.info(
    `[brand sync] ${uploaded} uploaded, ${plan.remove.length} removed, ${unchanged} unchanged.`
  );
}
