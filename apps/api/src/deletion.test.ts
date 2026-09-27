import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@track-social/db/schema';
import { cancelAccountDeletion, getAccountDeletion, isAccountDeletionReady, requestAccountDeletion } from './deletion';
import { getMyProfile } from './onboarding';
import { follow } from './social';

const env = {} as Env;

test('deletion request hides the account immediately and cancellation restores it within 30 days', async () => {
  const client = createClient({ url: 'file::memory:' });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../../packages/db/drizzle/', import.meta.url)) });
    const now = new Date('2026-09-27T00:00:00Z');
    assert.equal(await isAccountDeletionReady(env, db), false);
    for (const id of ['owner', 'viewer']) {
      await db.insert(schema.authUser).values({ id, name: id, email: `${id}@example.invalid`, createdAt: now, updatedAt: now });
      await db.insert(schema.users).values({
        id, birthDate: '2000-01-01', ageBand: '18+', status: 'active', termsVersion: 'test',
        privacyVersion: 'test', consentAt: now, createdAt: now, updatedAt: now,
      });
      await db.insert(schema.profiles).values({
        userId: id, username: id, displayName: id, isPrivate: false, createdAt: now, updatedAt: now,
      });
    }

    assert.deepEqual(await requestAccountDeletion(env, 'owner', {}, db, now), {
      status: 400, body: { error: 'confirmation_required' },
    });
    assert.equal((await db.select().from(schema.users).where(eq(schema.users.id, 'owner')))[0]?.status, 'active');
    assert.deepEqual(await requestAccountDeletion(env, 'owner', { confirm: true }, db, now), {
      status: 200, body: { status: 'pending', cancelUntil: '2026-10-27T00:00:00.000Z' },
    });
    assert.equal((await db.select().from(schema.users).where(eq(schema.users.id, 'owner')))[0]?.status, 'deletion_pending');
    assert.deepEqual(await getMyProfile(env, 'owner', db), {
      id: 'owner', onboardingComplete: true, status: 'deletion_pending',
    });
    assert.deepEqual(await follow(env, 'viewer', 'owner', db), { status: 404, body: { error: 'not_found' } });
    assert.deepEqual(await getAccountDeletion(env, 'owner', db), {
      status: 200, body: { status: 'pending', cancelUntil: '2026-10-27T00:00:00.000Z' },
    });
    assert.deepEqual(await cancelAccountDeletion(env, 'owner', db, new Date('2026-10-26T00:00:00Z')), {
      status: 200, body: { status: 'cancelled' },
    });
    assert.equal((await db.select().from(schema.users).where(eq(schema.users.id, 'owner')))[0]?.status, 'active');
    assert.equal((await getAccountDeletion(env, 'owner', db)).status, 404);
    assert.deepEqual(await cancelAccountDeletion(env, 'owner', db), { status: 404, body: { error: 'not_found' } });

    await requestAccountDeletion(env, 'owner', { confirm: true }, db, now);
    assert.deepEqual(await cancelAccountDeletion(env, 'owner', db, new Date('2026-10-28T00:00:00Z')), {
      status: 409, body: { error: 'cancellation_expired' },
    });
    assert.equal((await db.select().from(schema.users).where(eq(schema.users.id, 'owner')))[0]?.status, 'deletion_pending');
  } finally {
    client.close();
  }
});
