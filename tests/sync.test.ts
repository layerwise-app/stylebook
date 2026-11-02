import { describe, expect, it } from 'vitest';
import { planSync, SYNC_OWNER, tooLargeMessage, WORKER_BODY_LIMIT_BYTES } from '../src/lib/sync-plan';

const file = (key: string, sha256 = 'aaa', size = 100) => ({
  key,
  sha256,
  size,
  contentType: 'image/png'
});
const limit = 10_000_000;

describe('planSync', () => {
  it('uploads files missing from Storage', () => {
    expect(planSync([file('a.png')], [], limit).upload).toEqual(['a.png']);
  });
  it('skips files whose hash already matches', () => {
    const plan = planSync([file('a.png')], [{ key: 'a.png', sha256: 'aaa', owner: SYNC_OWNER }], limit);
    expect(plan).toEqual({ upload: [], remove: [], tooLarge: [] });
  });
  it('re-uploads files whose content changed', () => {
    const plan = planSync([file('a.png', 'new')], [{ key: 'a.png', sha256: 'old', owner: SYNC_OWNER }], limit);
    expect(plan.upload).toEqual(['a.png']);
  });
  it('deletes its own files that are no longer listed', () => {
    const plan = planSync([], [{ key: 'old.png', sha256: 'x', owner: SYNC_OWNER }], limit);
    expect(plan.remove).toEqual(['old.png']);
  });
  it('leaves files it did not upload alone', () => {
    const plan = planSync([], [{ key: 'someone-elses.pdf' }], limit);
    expect(plan.remove).toEqual([]);
  });
  it('reports files over the plan limit instead of uploading them', () => {
    const plan = planSync([file('huge.zip', 'h', limit + 1)], [], limit);
    expect(plan.upload).toEqual([]);
    expect(plan.tooLarge).toEqual([{ key: 'huge.zip', size: limit + 1, limitBytes: limit, reason: 'plan' }]);
    expect(tooLargeMessage(plan.tooLarge[0]!)).toContain('per-file limit');
    expect(tooLargeMessage(plan.tooLarge[0]!)).toContain('brand-files/huge.zip');
  });
  it('reports files too big for a Worker request on larger plans', () => {
    const fiveGb = 5_000_000_000;
    const plan = planSync([file('film.mp4', 'h', WORKER_BODY_LIMIT_BYTES + 1)], [], fiveGb);
    expect(plan.tooLarge[0]?.reason).toBe('worker');
  });
  it('does not delete a too-large file that is still listed', () => {
    const plan = planSync(
      [file('huge.zip', 'h', limit + 1)],
      [{ key: 'huge.zip', sha256: 'old', owner: SYNC_OWNER }],
      limit
    );
    expect(plan.remove).toEqual([]);
  });
});
