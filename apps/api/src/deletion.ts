import { and, eq } from 'drizzle-orm';
import { accountDeletionRequests, featureFlags, users } from '@track-social/db/schema';
import { createDatabase } from './db';

const CANCELLATION_DAYS = 30;

export async function isAccountDeletionReady(env: Env, db = createDatabase(env)) {
  const rows = await db.select({ enabled: featureFlags.enabled }).from(featureFlags)
    .where(eq(featureFlags.key, 'account_deletion_enabled')).limit(1);
  return rows[0]?.enabled ?? false;
}

export async function requestAccountDeletion(
  env: Env, userId: string, input: unknown, db = createDatabase(env), now = new Date(),
) {
  if (!input || typeof input !== 'object' || (input as { confirm?: unknown }).confirm !== true) {
    return { status: 400 as const, body: { error: 'confirmation_required' } };
  }
  const account = await db.select({ status: users.status }).from(users).where(eq(users.id, userId)).limit(1);
  if (!account.length) return { status: 403 as const, body: { error: 'onboarding_required' } };
  if (account[0].status === 'deletion_pending') {
    return { status: 409 as const, body: { error: 'deletion_already_requested' } };
  }
  if (!['active', 'suspended'].includes(account[0].status)) {
    return { status: 409 as const, body: { error: 'account_unavailable' } };
  }

  const cancelUntil = new Date(now.getTime() + CANCELLATION_DAYS * 24 * 60 * 60 * 1000);
  let changed = false;
  await db.transaction(async (tx) => {
    const updated = await tx.update(users).set({ status: 'deletion_pending', updatedAt: now })
      .where(and(eq(users.id, userId), eq(users.status, account[0].status)))
      .returning({ id: users.id });
    if (!updated.length) return;
    changed = true;
    await tx.insert(accountDeletionRequests).values({
      userId, previousStatus: account[0].status, status: 'pending', requestedAt: now,
      cancelUntil, cancelledAt: null,
    }).onConflictDoUpdate({
      target: accountDeletionRequests.userId,
      set: { previousStatus: account[0].status, status: 'pending', requestedAt: now, cancelUntil, cancelledAt: null },
    });
  });
  if (!changed) return { status: 409 as const, body: { error: 'account_changed' } };
  return { status: 200 as const, body: { status: 'pending', cancelUntil: cancelUntil.toISOString() } };
}

export async function getAccountDeletion(env: Env, userId: string, db = createDatabase(env)) {
  const rows = await db.select({ status: accountDeletionRequests.status, cancelUntil: accountDeletionRequests.cancelUntil })
    .from(accountDeletionRequests).where(eq(accountDeletionRequests.userId, userId)).limit(1);
  if (rows[0]?.status !== 'pending') return { status: 404 as const, body: { error: 'not_found' } };
  return { status: 200 as const, body: { status: 'pending', cancelUntil: rows[0].cancelUntil.toISOString() } };
}

export async function cancelAccountDeletion(env: Env, userId: string, db = createDatabase(env), now = new Date()) {
  const rows = await db.select({ previousStatus: accountDeletionRequests.previousStatus, cancelUntil: accountDeletionRequests.cancelUntil })
    .from(accountDeletionRequests)
    .where(and(eq(accountDeletionRequests.userId, userId), eq(accountDeletionRequests.status, 'pending'))).limit(1);
  if (!rows.length) return { status: 404 as const, body: { error: 'not_found' } };
  if (now > rows[0].cancelUntil) return { status: 409 as const, body: { error: 'cancellation_expired' } };

  let changed = false;
  await db.transaction(async (tx) => {
    const updated = await tx.update(accountDeletionRequests).set({ status: 'cancelled', cancelledAt: now })
      .where(and(eq(accountDeletionRequests.userId, userId), eq(accountDeletionRequests.status, 'pending')))
      .returning({ userId: accountDeletionRequests.userId });
    if (!updated.length) return;
    const restored = await tx.update(users).set({ status: rows[0].previousStatus, updatedAt: now })
      .where(and(eq(users.id, userId), eq(users.status, 'deletion_pending')))
      .returning({ id: users.id });
    changed = restored.length > 0;
    if (!changed) throw new Error('deletion_restore_failed');
  });
  if (!changed) return { status: 409 as const, body: { error: 'account_changed' } };
  return { status: 200 as const, body: { status: 'cancelled' } };
}
