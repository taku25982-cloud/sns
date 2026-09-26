import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const featureFlags = sqliteTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  configJson: text('config_json'),
  updatedBy: text('updated_by'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const inviteCodes = sqliteTable('invite_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  inviterUserId: text('inviter_user_id'),
  maxUses: integer('max_uses').notNull(),
  useCount: integer('use_count').notNull().default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
  status: text('status').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('invite_codes_status_idx').on(table.status)]);
