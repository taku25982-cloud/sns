import { and, desc, eq, exists, lt, notExists, or } from 'drizzle-orm';
import { z } from 'zod';
import type { FeedResponse } from '@track-social/contracts';
import { blocks, follows, mutes, posts, profiles, users } from '@track-social/db/schema';
import { createDatabase } from './db';

const PAGE_SIZE = 20;
const feedQuerySchema = z.object({
  tab: z.enum(['recommended', 'following']),
  cursor: z.string().regex(/^\d+_[0-9a-f-]{36}$/).optional(),
});

export async function getFeed(env: Env, viewerId: string, input: unknown, db = createDatabase(env)) {
  const parsed = feedQuerySchema.safeParse(input);
  if (!parsed.success) return { status: 400 as const, body: { error: 'invalid_input' } };
  const viewer = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, viewerId), eq(users.status, 'active'))).limit(1);
  if (!viewer.length) return { status: 403 as const, body: { error: 'onboarding_required' } };

  const [cursorTime, cursorId] = parsed.data.cursor?.split('_') ?? [];
  const cursorDate = cursorTime === undefined ? undefined : new Date(Number(cursorTime));
  if (cursorDate && Number.isNaN(cursorDate.getTime())) {
    return { status: 400 as const, body: { error: 'invalid_cursor' } };
  }
  const before = cursorDate && cursorId ? or(
    lt(posts.createdAt, cursorDate),
    and(eq(posts.createdAt, cursorDate), lt(posts.id, cursorId)),
  ) : undefined;
  const notBlocked = notExists(db.select({ id: blocks.blockerId }).from(blocks).where(or(
    and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, posts.authorId)),
    and(eq(blocks.blockerId, posts.authorId), eq(blocks.blockedId, viewerId)),
  )));
  const notMuted = notExists(db.select({ id: mutes.muterId }).from(mutes)
    .where(and(eq(mutes.muterId, viewerId), eq(mutes.mutedId, posts.authorId))));
  const source = parsed.data.tab === 'following'
    ? or(eq(posts.authorId, viewerId), exists(db.select({ id: follows.followerId }).from(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followeeId, posts.authorId)))))
    : or(eq(posts.authorId, viewerId), and(eq(posts.visibility, 'public'), eq(profiles.isPrivate, false)));

  const rows = await db.select({
    id: posts.id, authorId: posts.authorId, username: profiles.username,
    displayName: profiles.displayName, text: posts.text, visibility: posts.visibility,
    eventTag: posts.eventTag, createdAt: posts.createdAt,
  }).from(posts).innerJoin(users, eq(users.id, posts.authorId))
    .innerJoin(profiles, eq(profiles.userId, posts.authorId))
    .where(and(eq(posts.status, 'published'), eq(users.status, 'active'), source, notBlocked, notMuted, before))
    .orderBy(desc(posts.createdAt), desc(posts.id)).limit(PAGE_SIZE + 1);
  const page = rows.slice(0, PAGE_SIZE);
  const last = page.at(-1);
  const body = {
    posts: page.map((post) => ({
      ...post,
      visibility: post.visibility === 'public' ? 'public' as const : 'followers' as const,
      createdAt: post.createdAt.toISOString(),
    })),
    nextCursor: rows.length > PAGE_SIZE && last ? `${last.createdAt.getTime()}_${last.id}` : null,
  } satisfies FeedResponse;
  return {
    status: 200 as const,
    body,
  };
}
