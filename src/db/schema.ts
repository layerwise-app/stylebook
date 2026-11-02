import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Password tries per client, used only when SITE_PASSWORD is set. `client_key`
 * is an HMAC of the client address, so no address is ever stored. Old rows are
 * removed during password attempts, so no scheduled job is needed.
 */
export const passwordAttempts = sqliteTable('password_attempts', {
  clientKey: text('client_key').primaryKey(),
  attempts: integer('attempts').notNull(),
  windowStartedAt: integer('window_started_at').notNull()
});
