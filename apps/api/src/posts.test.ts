import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@track-social/db/schema';
import { todayInJapan } from './age';
import { createPost, deletePost, getPost } from './posts';

const env = {} as Env;

test('post access respects teen privacy, followers, blocks, deletion, and account status', async () => {
  const client = createClient({ url: 'file::memory:' });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../../packages/db/drizzle/', import.meta.url)) });
    const now = new Date();
    const year = Number(todayInJapan(now).slice(0, 4));
    for (const [id, age, isPrivate] of [
      ['teen', 15, true], ['adult', 19, false], ['follower', 19, false], ['outsider', 19, false],
    ] as const) {
      await db.insert(schema.authUser).values({ id, name: id, email: `${id}@example.invalid`, createdAt: now, updatedAt: now });
      await db.insert(schema.users).values({
        id, birthDate: `${year - age}-01-01`, ageBand: 'test', status: 'active', termsVersion: 'test',
        privacyVersion: 'test', consentAt: now, createdAt: now, updatedAt: now,
      });
      await db.insert(schema.profiles).values({
        userId: id, username: id, displayName: id, isPrivate, createdAt: now, updatedAt: now,
      });
    }
    assert.deepEqual(await createPost(env, 'teen', { text: '練習', visibility: 'public' }, db), {
      status: 403, body: { error: 'public_post_unavailable' },
    });
    const teenCreated = await createPost(env, 'teen', { text: '練習', visibility: 'followers', eventTag: '100m' }, db);
    assert.equal(teenCreated.status, 201);
    const teenPostId = teenCreated.body.id as string;
    assert.equal((await getPost(env, 'outsider', teenPostId, db)).status, 404);
    await db.insert(schema.follows).values({ followerId: 'follower', followeeId: 'teen', createdAt: now });
    const visible = await getPost(env, 'follower', teenPostId, db);
    assert.equal(visible.status, 200);
    assert.equal((visible.body.post as { text: string }).text, '練習');
    await db.insert(schema.blocks).values({ blockerId: 'teen', blockedId: 'follower', createdAt: now });
    assert.equal((await getPost(env, 'follower', teenPostId, db)).status, 404);

    const adultCreated = await createPost(env, 'adult', { text: '大会の記録', visibility: 'public' }, db);
    assert.equal(adultCreated.status, 201);
    const adultPostId = adultCreated.body.id as string;
    assert.equal((await getPost(env, 'outsider', adultPostId, db)).status, 200);
    assert.equal((await deletePost(env, 'outsider', adultPostId, db)).status, 404);
    assert.deepEqual(await deletePost(env, 'adult', adultPostId, db), { status: 200, body: { status: 'deleted' } });
    assert.equal((await getPost(env, 'outsider', adultPostId, db)).status, 404);

    await db.update(schema.users).set({ status: 'deletion_pending' }).where(eq(schema.users.id, 'teen'));
    assert.equal((await getPost(env, 'teen', teenPostId, db)).status, 403);
    assert.equal((await getPost(env, 'outsider', teenPostId, db)).status, 404);
    assert.equal((await createPost(env, 'teen', { text: '追加' }, db)).status, 403);
  } finally {
    client.close();
  }
});
