import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '@track-social/db/schema';
import { getFeed } from './feed';

const env = {} as Env;

test('feed filters private, blocked, muted and inactive authors and paginates tied timestamps', async () => {
  const client = createClient({ url: 'file::memory:' });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../../packages/db/drizzle/', import.meta.url)) });
    const now = new Date('2026-09-27T00:00:00Z');
    for (const [id, isPrivate, status] of [
      ['viewer', false, 'active'], ['publicAuthor', false, 'active'], ['newAuthor', false, 'active'],
      ['privateAuthor', true, 'active'], ['blockedAuthor', false, 'active'],
      ['mutedAuthor', false, 'active'], ['pendingAuthor', false, 'deletion_pending'],
    ] as const) {
      await db.insert(schema.authUser).values({ id, name: id, email: `${id}@example.invalid`, createdAt: now, updatedAt: now });
      await db.insert(schema.users).values({
        id, birthDate: '2000-01-01', ageBand: '18+', status, termsVersion: 'test',
        privacyVersion: 'test', consentAt: now, createdAt: now, updatedAt: now,
      });
      await db.insert(schema.profiles).values({
        userId: id, username: id.toLowerCase(), displayName: id, isPrivate,
        createdAt: now, updatedAt: now,
      });
    }
    await db.insert(schema.follows).values([
      { followerId: 'viewer', followeeId: 'publicAuthor', createdAt: now },
      { followerId: 'viewer', followeeId: 'privateAuthor', createdAt: now },
      { followerId: 'viewer', followeeId: 'blockedAuthor', createdAt: now },
      { followerId: 'viewer', followeeId: 'mutedAuthor', createdAt: now },
    ]);
    await db.insert(schema.blocks).values({ blockerId: 'blockedAuthor', blockedId: 'viewer', createdAt: now });
    await db.insert(schema.mutes).values({ muterId: 'viewer', mutedId: 'mutedAuthor', createdAt: now });
    const post = (n: number, authorId: string, visibility = 'public', status = 'published') => ({
      id: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
      authorId, text: `投稿 ${n}`, visibility, status, createdAt: now, updatedAt: now,
    });
    await db.insert(schema.posts).values([
      ...Array.from({ length: 22 }, (_, i) => post(i + 1, 'publicAuthor')),
      post(23, 'newAuthor'), post(24, 'privateAuthor', 'followers'),
      post(25, 'blockedAuthor'), post(26, 'mutedAuthor'), post(27, 'pendingAuthor'),
      post(28, 'publicAuthor', 'followers'), post(29, 'publicAuthor', 'public', 'deleted'),
    ]);

    const first = await getFeed(env, 'viewer', { tab: 'recommended' }, db);
    assert.equal(first.status, 200);
    const firstPosts = first.body.posts as { id: string; authorId: string }[];
    assert.equal(firstPosts.length, 20);
    assert.equal(firstPosts[0]?.authorId, 'newAuthor'); // zero followers can appear
    assert.ok(first.body.nextCursor);
    const second = await getFeed(env, 'viewer', { tab: 'recommended', cursor: first.body.nextCursor }, db);
    assert.equal(second.status, 200);
    const secondPosts = second.body.posts as { id: string }[];
    assert.equal(secondPosts.length, 3);
    assert.equal(second.body.nextCursor, null);
    assert.equal(new Set([...firstPosts, ...secondPosts].map((item) => item.id)).size, 23);

    const following = await getFeed(env, 'viewer', { tab: 'following' }, db);
    assert.equal(following.status, 200);
    const followingPosts = following.body.posts as { authorId: string; visibility: string }[];
    assert.ok(followingPosts.some((item) => item.authorId === 'privateAuthor' && item.visibility === 'followers'));
    assert.ok(followingPosts.every((item) => !['blockedAuthor', 'mutedAuthor', 'pendingAuthor'].includes(item.authorId)));
    assert.equal((await getFeed(env, 'viewer', { tab: 'recommended', cursor: 'bad' }, db)).status, 400);
  } finally {
    client.close();
  }
});
