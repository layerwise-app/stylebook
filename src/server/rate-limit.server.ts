import { eq, lte, sql } from 'drizzle-orm';
import { db } from '~/db';
import { passwordAttempts } from '~/db/schema';

export const MAX_ATTEMPTS = 5;
export const WINDOW_SECONDS = 15 * 60;

export type AttemptResult = { allowed: boolean; retryAfterSeconds: number };

export type AttemptLimiter = {
  /** Counts a try and says whether it may proceed. */
  consume(clientKey: string): Promise<AttemptResult>;
  /** Forgets a client after a correct password. */
  clear(clientKey: string): Promise<void>;
};

export const databaseLimiter: AttemptLimiter = {
  async consume(clientKey) {
    const now = Math.floor(Date.now() / 1000);
    // One batch is one transaction: expired rows go first, so an expired window
    // restarts at 1, and concurrent tries can't count the same slot twice.
    // This delete is the table's only cleanup, so no scheduled job is needed.
    const [, rows] = await db.batch([
      db
        .delete(passwordAttempts)
        .where(lte(passwordAttempts.windowStartedAt, now - WINDOW_SECONDS)),
      db
        .insert(passwordAttempts)
        .values({ clientKey, attempts: 1, windowStartedAt: now })
        .onConflictDoUpdate({
          target: passwordAttempts.clientKey,
          set: { attempts: sql`${passwordAttempts.attempts} + 1` }
        })
        .returning({
          attempts: passwordAttempts.attempts,
          windowStartedAt: passwordAttempts.windowStartedAt
        })
    ]);
    const row = rows[0]!;
    return {
      allowed: row.attempts <= MAX_ATTEMPTS,
      retryAfterSeconds: Math.max(1, row.windowStartedAt + WINDOW_SECONDS - now)
    };
  },
  async clear(clientKey) {
    await db.delete(passwordAttempts).where(eq(passwordAttempts.clientKey, clientKey));
  }
};
