import { and, eq, or } from 'drizzle-orm';
import { blocks, followRequests, follows, mutes, profiles, users } from '@track-social/db/schema';
import { createDatabase } from './db';

type Result = { status: 200 | 201 | 400 | 403 | 404 | 409; body: Record<string, unknown> };

async function activeUser(db: ReturnType<typeof createDatabase>, id: string) {
  const rows = await db.select({ id: users.id, isPrivate: profiles.isPrivate })
    .from(users).innerJoin(profiles, eq(users.id, profiles.userId))
    .where(and(eq(users.id, id), eq(users.status, 'active'))).limit(1);
  return rows[0];
}

async function blocked(db: ReturnType<typeof createDatabase>, first: string, second: string) {
  const rows = await db.select({ blockerId: blocks.blockerId }).from(blocks)
    .where(or(
      and(eq(blocks.blockerId, first), eq(blocks.blockedId, second)),
      and(eq(blocks.blockerId, second), eq(blocks.blockedId, first)),
    )).limit(1);
  return rows.length > 0;
}

export async function follow(env: Env, actorId: string, targetId: string, db = createDatabase(env)): Promise<Result> {
  if (actorId === targetId) return { status: 400, body: { error: 'self_action' } };
  if (!await activeUser(db, actorId)) return { status: 403, body: { error: 'onboarding_required' } };
  const target = await activeUser(db, targetId);
  if (!target || await blocked(db, actorId, targetId)) return { status: 404, body: { error: 'not_found' } };

  const existing = await db.select({ followerId: follows.followerId }).from(follows)
    .where(and(eq(follows.followerId, actorId), eq(follows.followeeId, targetId))).limit(1);
  if (existing.length) return { status: 200, body: { state: 'following' } };

  const now = new Date();
  if (target.isPrivate) {
    await db.insert(followRequests).values({ requesterId: actorId, targetId, status: 'pending', createdAt: now })
      .onConflictDoUpdate({ target: [followRequests.requesterId, followRequests.targetId], set: { status: 'pending', createdAt: now, resolvedAt: null } });
    return { status: 200, body: { state: 'requested' } };
  }
  await db.insert(follows).values({ followerId: actorId, followeeId: targetId, createdAt: now }).onConflictDoNothing();
  return { status: 201, body: { state: 'following' } };
}

export async function unfollow(env: Env, actorId: string, targetId: string): Promise<Result> {
  const db = createDatabase(env);
  await db.transaction(async (tx) => {
    await tx.delete(follows).where(and(eq(follows.followerId, actorId), eq(follows.followeeId, targetId)));
    await tx.delete(followRequests).where(and(eq(followRequests.requesterId, actorId), eq(followRequests.targetId, targetId)));
  });
  return { status: 200, body: { state: 'none' } };
}

export async function resolveFollowRequest(env: Env, actorId: string, requesterId: string, accept: boolean, db = createDatabase(env)): Promise<Result> {
  if (!await activeUser(db, actorId)) return { status: 403, body: { error: 'onboarding_required' } };
  const pending = await db.select({ status: followRequests.status }).from(followRequests)
    .where(and(eq(followRequests.requesterId, requesterId), eq(followRequests.targetId, actorId))).limit(1);
  if (pending[0]?.status !== 'pending' || !await activeUser(db, requesterId) || await blocked(db, actorId, requesterId)) {
    return { status: 404, body: { error: 'not_found' } };
  }
  const now = new Date();
  let resolved = false;
  await db.transaction(async (tx) => {
    const result = await tx.update(followRequests).set({ status: accept ? 'accepted' : 'rejected', resolvedAt: now })
      .where(and(eq(followRequests.requesterId, requesterId), eq(followRequests.targetId, actorId), eq(followRequests.status, 'pending')))
      .returning({ requesterId: followRequests.requesterId });
    resolved = result.length > 0;
    if (accept && result.length) {
      await tx.insert(follows).values({ followerId: requesterId, followeeId: actorId, createdAt: now }).onConflictDoNothing();
    }
  });
  if (!resolved) return { status: 409, body: { error: 'request_already_resolved' } };
  return { status: 200, body: { state: accept ? 'accepted' : 'rejected' } };
}

export async function pendingFollowRequests(env: Env, actorId: string): Promise<Result> {
  const db = createDatabase(env);
  if (!await activeUser(db, actorId)) return { status: 403, body: { error: 'onboarding_required' } };
  const requests = await db.select({ requesterId: followRequests.requesterId, createdAt: followRequests.createdAt })
    .from(followRequests)
    .where(and(eq(followRequests.targetId, actorId), eq(followRequests.status, 'pending')))
    .orderBy(followRequests.createdAt).limit(100);
  return { status: 200, body: { requests } };
}

export async function setBlock(env: Env, actorId: string, targetId: string, enabled: boolean, db = createDatabase(env)): Promise<Result> {
  if (actorId === targetId) return { status: 400, body: { error: 'self_action' } };
  if (!await activeUser(db, actorId)) return { status: 403, body: { error: 'onboarding_required' } };
  if (enabled && !await activeUser(db, targetId)) return { status: 404, body: { error: 'not_found' } };

  await db.transaction(async (tx) => {
    if (enabled) {
      await tx.insert(blocks).values({ blockerId: actorId, blockedId: targetId, createdAt: new Date() }).onConflictDoNothing();
      await tx.delete(follows).where(or(
        and(eq(follows.followerId, actorId), eq(follows.followeeId, targetId)),
        and(eq(follows.followerId, targetId), eq(follows.followeeId, actorId)),
      ));
      await tx.delete(followRequests).where(or(
        and(eq(followRequests.requesterId, actorId), eq(followRequests.targetId, targetId)),
        and(eq(followRequests.requesterId, targetId), eq(followRequests.targetId, actorId)),
      ));
    } else {
      await tx.delete(blocks).where(and(eq(blocks.blockerId, actorId), eq(blocks.blockedId, targetId)));
    }
  });
  return { status: 200, body: { blocked: enabled } };
}

export async function setMute(env: Env, actorId: string, targetId: string, enabled: boolean): Promise<Result> {
  if (actorId === targetId) return { status: 400, body: { error: 'self_action' } };
  const db = createDatabase(env);
  if (!await activeUser(db, actorId)) return { status: 403, body: { error: 'onboarding_required' } };
  if (enabled && !await activeUser(db, targetId)) return { status: 404, body: { error: 'not_found' } };
  if (enabled) {
    await db.insert(mutes).values({ muterId: actorId, mutedId: targetId, createdAt: new Date() }).onConflictDoNothing();
  } else {
    await db.delete(mutes).where(and(eq(mutes.muterId, actorId), eq(mutes.mutedId, targetId)));
  }
  return { status: 200, body: { muted: enabled } };
}
