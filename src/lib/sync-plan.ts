// Decides what the preview's sync has to do. Pure, so the rules can be tested
// without touching Storage.

export const SYNC_OWNER = 'stylebook';
/** A request through the Worker carries about 90 MB. */
export const WORKER_BODY_LIMIT_BYTES = 90 * 1000 * 1000;

export type LocalFile = { key: string; sha256: string; size: number; contentType: string };
export type RemoteFile = { key: string; sha256?: string; owner?: string };

export type TooLarge = { key: string; size: number; limitBytes: number; reason: 'plan' | 'worker' };

export type SyncPlan = { upload: string[]; remove: string[]; tooLarge: TooLarge[] };

export function planSync(local: LocalFile[], remote: RemoteFile[], maxFileBytes: number): SyncPlan {
  const remoteByKey = new Map(remote.map((f) => [f.key, f]));
  const localKeys = new Set(local.map((f) => f.key));
  const plan: SyncPlan = { upload: [], remove: [], tooLarge: [] };

  for (const file of local) {
    if (file.size > maxFileBytes) {
      plan.tooLarge.push({ key: file.key, size: file.size, limitBytes: maxFileBytes, reason: 'plan' });
    } else if (file.size > WORKER_BODY_LIMIT_BYTES) {
      plan.tooLarge.push({ key: file.key, size: file.size, limitBytes: WORKER_BODY_LIMIT_BYTES, reason: 'worker' });
    } else if (remoteByKey.get(file.key)?.sha256 !== file.sha256) {
      plan.upload.push(file.key);
    }
  }
  // Only files this sync uploaded are ever deleted. Anything else in the
  // project's Storage is left alone.
  for (const file of remote) {
    if (file.owner === SYNC_OWNER && !localKeys.has(file.key)) plan.remove.push(file.key);
  }
  return plan;
}

const megabytes = (bytes: number) => `${(bytes / 1000 / 1000).toFixed(1)} MB`;

export function tooLargeMessage(file: TooLarge) {
  return file.reason === 'plan'
    ? `brand-files/${file.key} is ${megabytes(file.size)}, over your plan's ${megabytes(file.limitBytes)} per-file limit, so it was not uploaded. Make the file smaller or upgrade the plan.`
    : `brand-files/${file.key} is ${megabytes(file.size)}, over the ${megabytes(file.limitBytes)} a request can carry, so it was not uploaded. Make the file smaller.`;
}
