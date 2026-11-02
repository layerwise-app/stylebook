// Dev-only sync endpoint. src/server.ts only imports this when
// import.meta.env.DEV is true, so it isn't in the production bundle. The
// brandSync Vite plugin drives it: the Worker has Storage but no file system, and
// the plugin has the reverse.

import { env } from 'cloudflare:workers';
import { getStorageErrorCode, type StorageObject } from '~/lib/storage';
import {
  planSync,
  SYNC_OWNER,
  tooLargeMessage,
  type LocalFile,
  type TooLarge
} from '~/lib/sync-plan';

declare const __BRAND_SYNC_TOKEN__: string;

const SYNC_PREFIX = '/__stylebook/sync/';

export type DevSyncStatus = {
  errors: string[];
  uploaded: number;
  removed: number;
  unchanged: number;
};

// Read by the preview's error banner. Kept on globalThis to survive module reloads.
const state = globalThis as typeof globalThis & { __brandSyncStatus?: DevSyncStatus };

export function devSyncStatus() {
  return state.__brandSyncStatus ?? null;
}

export function isDevSyncRequest(request: Request) {
  return new URL(request.url).pathname.startsWith(SYNC_PREFIX);
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' }
  });

async function listAll() {
  const objects: StorageObject[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.STORAGE.list({ cursor, limit: 1000 });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects;
}

async function plan(request: Request) {
  const { files } = (await request.json()) as { files: LocalFile[] };
  const [remote, usage] = await Promise.all([listAll(), env.STORAGE.usage()]);
  const result = planSync(
    files,
    remote.map((o) => ({
      key: o.key,
      sha256: o.customMetadata?.sha256,
      owner: o.customMetadata?.owner
    })),
    usage.maxFileBytes
  );
  return json({
    ...result,
    messages: result.tooLarge.map((f: TooLarge) => tooLargeMessage(f)),
    readOnly: usage.readOnly,
    total: files.length
  });
}

async function upload(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const sha256 = request.headers.get('x-sha256');
  if (!key || !sha256) return json({ error: 'key and x-sha256 are required' }, 400);
  try {
    await env.STORAGE.put(key, await request.arrayBuffer(), {
      contentType: request.headers.get('content-type') ?? 'application/octet-stream',
      customMetadata: { sha256, owner: SYNC_OWNER }
    });
    return json({ ok: true });
  } catch (error) {
    const code = getStorageErrorCode(error);
    const message =
      code === 'FileTooLarge'
        ? `brand-files/${key} is over your plan's per-file limit, so it was not uploaded. Make the file smaller or upgrade the plan.`
        : code === 'StorageQuotaExceeded'
          ? `brand-files/${key} was not uploaded because project Storage is full. Delete files or upgrade the plan.`
          : `brand-files/${key} failed to upload: ${error instanceof Error ? error.message : String(error)}`;
    return json({ error: message }, 502);
  }
}

async function finish(request: Request) {
  const body = (await request.json()) as {
    remove: string[];
    errors: string[];
    uploaded: number;
    unchanged: number;
  };
  if (body.remove.length) await env.STORAGE.delete(body.remove);
  state.__brandSyncStatus = {
    errors: body.errors,
    uploaded: body.uploaded,
    removed: body.remove.length,
    unchanged: body.unchanged
  };
  return json({ ok: true });
}

export async function handleDevSync(request: Request) {
  // The token is random per dev server, so another site open in the same browser
  // can't drive this endpoint.
  if (request.headers.get('x-sync-token') !== __BRAND_SYNC_TOKEN__) {
    return json({ error: 'Bad sync token' }, 403);
  }
  if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
  const step = new URL(request.url).pathname.slice(SYNC_PREFIX.length);
  try {
    if (step === 'plan') return await plan(request);
    if (step === 'upload') return await upload(request);
    if (step === 'finish') return await finish(request);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
  return json({ error: 'Unknown step' }, 404);
}
