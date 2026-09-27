import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@track-social/db/schema';
import { todayInJapan } from './age';
import { updatePrivacy } from './onboarding';
import { follow, resolveFollowRequest, setBlock } from './social';

const env = {} as Env;

test('private follow requests, blocking, and age privacy rules use an isolated database', async () => {
  const client = createClient({ url: 'file::memory:' });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../../packages/db/drizzle/', import.meta.url)) });

    const now = new Date();
    const year = Number(todayInJapan(now).slice(0, 4));
    for (const [id, birthDate, isPrivate] of [
      ['teen', `${year - 15}-01-01`, true],
      ['runner', `${year - 19}-01-01`, false],
      ['olderTeen', `${year - 17}-01-01`, true],
    ] as const) {
      await db.insert(schema.authUser).values({ id, name: id, email: `${id}@example.invalid`, createdAt: now, updatedAt: now });
      await db.insert(schema.users).values({
        id, birthDate, ageBand: 'test', status: 'active', termsVersion: 'test', privacyVersion: 'test',
        consentAt: now, createdAt: now, updatedAt: now,
      });
      await db.insert(schema.profiles).values({
        userId: id, username: id.toLowerCase(), displayName: id, isPrivate,
        createdAt: now, updatedAt: now,
      });
    }

    assert.deepEqual(await follow(env, 'runner', 'teen', db), { status: 200, body: { state: 'requested' } });
    assert.equal((await db.select().from(schema.follows)).length, 0);
    assert.equal((await db.select().from(schema.followRequests)).length, 1);

    assert.deepEqual(await setBlock(env, 'teen', 'runner', true, db), { status: 200, body: { blocked: true } });
    assert.equal((await db.select().from(schema.followRequests)).length, 0);
    assert.deepEqual(await follow(env, 'runner', 'teen', db), { status: 404, body: { error: 'not_found' } });

    await setBlock(env, 'teen', 'runner', false, db);
    await follow(env, 'runner', 'teen', db);
    assert.deepEqual(await resolveFollowRequest(env, 'teen', 'runner', true, db), { status: 200, body: { state: 'accepted' } });
    assert.equal((await db.select().from(schema.follows)).length, 1);
    await setBlock(env, 'teen', 'runner', true, db);
    assert.equal((await db.select().from(schema.follows)).length, 0);

    await db.update(schema.users).set({ status: 'suspended' }).where(eq(schema.users.id, 'runner'));
    assert.deepEqual(await follow(env, 'runner', 'olderTeen', db), {
      status: 403, body: { error: 'onboarding_required' },
    });

    assert.deepEqual(await updatePrivacy(env, 'teen', { isPrivate: false }, db), {
      status: 403, body: { error: 'public_account_unavailable' },
    });
    assert.deepEqual(await updatePrivacy(env, 'olderTeen', { isPrivate: false }, db), {
      status: 400, body: { error: 'confirmation_required' },
    });
    assert.deepEqual(await updatePrivacy(env, 'olderTeen', { isPrivate: false, acknowledgePublicRisks: true }, db), {
      status: 200, body: { isPrivate: false },
    });
    assert.equal((await db.select({ isPrivate: schema.profiles.isPrivate }).from(schema.profiles)
      .where(eq(schema.profiles.userId, 'olderTeen')))[0]?.isPrivate, false);
  } finally {
    client.close();
  }
});
