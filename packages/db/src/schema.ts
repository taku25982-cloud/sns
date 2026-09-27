import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const authUser = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const authSession = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('session_user_idx').on(table.userId)]);

export const authAccount = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [
  index('account_user_idx').on(table.userId),
  uniqueIndex('account_provider_unique').on(table.providerId, table.accountId),
]);

export const authVerification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('verification_identifier_idx').on(table.identifier)]);

export const users = sqliteTable('users', {
  id: text('id').primaryKey().references(() => authUser.id, { onDelete: 'cascade' }),
  birthDate: text('birth_date').notNull(),
  ageBand: text('age_band').notNull(),
  status: text('status').notNull().default('active'),
  termsVersion: text('terms_version').notNull(),
  privacyVersion: text('privacy_version').notNull(),
  consentAt: integer('consent_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const accountDeletionRequests = sqliteTable('account_deletion_requests', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  previousStatus: text('previous_status').notNull(),
  status: text('status').notNull(),
  requestedAt: integer('requested_at', { mode: 'timestamp_ms' }).notNull(),
  cancelUntil: integer('cancel_until', { mode: 'timestamp_ms' }).notNull(),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp_ms' }),
});

export const profiles = sqliteTable('profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarKey: text('avatar_key'),
  bio: text('bio'),
  prefecture: text('prefecture'),
  affiliation: text('affiliation'),
  schoolStage: text('school_stage'),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull(),
  dmPolicy: text('dm_policy').notNull().default('following'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const userEvents = sqliteTable('user_events', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventCode: text('event_code').notNull(),
  priority: integer('priority').notNull().default(0),
}, (table) => [primaryKey({ columns: [table.userId, table.eventCode] })]);

export const follows = sqliteTable('follows', {
  followerId: text('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followeeId: text('followee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followeeId] }),
  index('follows_followee_idx').on(table.followeeId, table.createdAt),
]);

export const followRequests = sqliteTable('follow_requests', {
  requesterId: text('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetId: text('target_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
}, (table) => [
  primaryKey({ columns: [table.requesterId, table.targetId] }),
  index('follow_requests_target_idx').on(table.targetId, table.status, table.createdAt),
]);

export const blocks = sqliteTable('blocks', {
  blockerId: text('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: text('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.blockerId, table.blockedId] }),
  index('blocks_blocked_idx').on(table.blockedId),
]);

export const mutes = sqliteTable('mutes', {
  muterId: text('muter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mutedId: text('muted_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [primaryKey({ columns: [table.muterId, table.mutedId] })]);

export const adminUsers = sqliteTable('admin_users', {
  userId: text('user_id').primaryKey().references(() => authUser.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(),
  details: text('details'),
  priority: text('priority').notNull(),
  status: text('status').notNull().default('open'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
}, (table) => [
  index('reports_queue_idx').on(table.status, table.priority, table.createdAt),
  index('reports_reporter_idx').on(table.reporterId, table.createdAt),
  index('reports_target_idx').on(table.targetType, table.targetId),
]);

export const moderationActions = sqliteTable('moderation_actions', {
  id: text('id').primaryKey(),
  targetUserId: text('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  actionType: text('action_type').notNull(),
  reason: text('reason').notNull(),
  moderatorId: text('moderator_id').notNull().references(() => adminUsers.userId),
  startsAt: integer('starts_at', { mode: 'timestamp_ms' }).notNull(),
  endsAt: integer('ends_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('moderation_actions_target_idx').on(table.targetUserId, table.createdAt)]);

export const moderationAuditLog = sqliteTable('moderation_audit_log', {
  id: text('id').primaryKey(),
  actorAdminId: text('actor_admin_id').notNull().references(() => adminUsers.userId),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  metadata: text('metadata').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [index('moderation_audit_actor_idx').on(table.actorAdminId, table.createdAt)]);

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
