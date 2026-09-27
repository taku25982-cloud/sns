import { and, eq, or } from 'drizzle-orm';
import { createPostSchema } from '@track-social/contracts';
import { blocks, follows, posts, profiles, users } from '@track-social/db/schema';
import { ageOnDate, todayInJapan } from './age';
import { createDatabase } from './db';

export async function createPost(env: Env, authorId: string, input: unknown, db = createDatabase(env)) {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) return { status: 400 as const, body: { error: 'invalid_input' } };
  const account = await db.select({ birthDate: users.birthDate, status: users.status, isPrivate: profiles.isPrivate })
    .from(users).innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, authorId)).limit(1);
  if (account[0]?.status !== 'active') return { status: 403 as const, body: { error: 'onboarding_required' } };
  const age = ageOnDate(account[0].birthDate, todayInJapan());
  if (age === null) return { status: 403 as const, body: { error: 'account_unavailable' } };
  if (parsed.data.visibility === 'public' && (account[0].isPrivate || age < 16)) {
    return { status: 403 as const, body: { error: 'public_post_unavailable' } };
  }
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(posts).values({
    id, authorId, text: parsed.data.text, visibility: parsed.data.visibility,
    eventTag: parsed.data.eventTag ?? null, status: 'published', createdAt: now, updatedAt: now,
  });
  return { status: 201 as const, body: { id } };
}

export async function getPost(env: Env, viewerId: string, postId: string, db = createDatabase(env)) {
  const viewer = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, viewerId), eq(users.status, 'active'))).limit(1);
  if (!viewer.length) return { status: 403 as const, body: { error: 'onboarding_required' } };
  const rows = await db.select({
    id: posts.id, authorId: posts.authorId, text: posts.text, visibility: posts.visibility,
    eventTag: posts.eventTag, createdAt: posts.createdAt, isPrivate: profiles.isPrivate,
  }).from(posts).innerJoin(users, eq(users.id, posts.authorId))
    .innerJoin(profiles, eq(profiles.userId, posts.authorId))
    .where(and(eq(posts.id, postId), eq(posts.status, 'published'), eq(users.status, 'active'))).limit(1);
  const post = rows[0];
  if (!post) return { status: 404 as const, body: { error: 'not_found' } };
  if (post.authorId !== viewerId) {
    const blocked = await db.select({ blockerId: blocks.blockerId }).from(blocks)
      .where(or(
        and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, post.authorId)),
        and(eq(blocks.blockerId, post.authorId), eq(blocks.blockedId, viewerId)),
      )).limit(1);
    if (blocked.length) return { status: 404 as const, body: { error: 'not_found' } };
    if (post.isPrivate || post.visibility === 'followers') {
      const following = await db.select({ followerId: follows.followerId }).from(follows)
        .where(and(eq(follows.followerId, viewerId), eq(follows.followeeId, post.authorId))).limit(1);
      if (!following.length) return { status: 404 as const, body: { error: 'not_found' } };
    }
  }
  const { isPrivate, ...visiblePost } = post;
  return { status: 200 as const, body: { post: visiblePost } };
}

export async function deletePost(env: Env, actorId: string, postId: string, db = createDatabase(env)) {
  const actor = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, actorId), eq(users.status, 'active'))).limit(1);
  if (!actor.length) return { status: 403 as const, body: { error: 'onboarding_required' } };
  const updated = await db.update(posts).set({ status: 'deleted', deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(posts.id, postId), eq(posts.authorId, actorId), eq(posts.status, 'published')))
    .returning({ id: posts.id });
  if (!updated.length) return { status: 404 as const, body: { error: 'not_found' } };
  return { status: 200 as const, body: { status: 'deleted' } };
}
