import { and, desc, eq, gte } from 'drizzle-orm';
import { z } from 'zod';
import { adminUsers, moderationActions, moderationAuditLog, reports, users } from '@track-social/db/schema';
import { createDatabase } from './db';

type Result = { status: 200 | 201 | 400 | 403 | 404 | 409 | 429; body: Record<string, unknown> };

const reportInput = z.object({
  targetType: z.enum(['user', 'profile']),
  targetId: z.string().min(1).max(128),
  reason: z.enum(['harassment', 'bullying', 'sexual_content', 'minor_safety', 'impersonation', 'spam', 'other']),
  details: z.string().trim().max(1000).optional(),
});

const reviewInput = z.object({
  decision: z.enum(['dismiss', 'suspend']),
  reason: z.string().trim().min(10).max(1000),
});

async function isActive(db: ReturnType<typeof createDatabase>, id: string) {
  const found = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, id), eq(users.status, 'active'))).limit(1);
  return found.length > 0;
}

export async function submitReport(env: Env, reporterId: string, input: unknown, db = createDatabase(env)): Promise<Result> {
  const parsed = reportInput.safeParse(input);
  if (!parsed.success) return { status: 400, body: { error: 'invalid_input' } };
  if (!await isActive(db, reporterId)) return { status: 403, body: { error: 'onboarding_required' } };
  if (reporterId === parsed.data.targetId) return { status: 400, body: { error: 'self_report' } };
  if (!await isActive(db, parsed.data.targetId)) return { status: 404, body: { error: 'not_found' } };

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const recent = await db.select({ id: reports.id, targetId: reports.targetId, status: reports.status })
    .from(reports).where(and(eq(reports.reporterId, reporterId), gte(reports.createdAt, dayStart)))
    .limit(10);
  if (recent.some((report) => report.targetId === parsed.data.targetId && report.status === 'open')) {
    return { status: 409, body: { error: 'already_reported' } };
  }
  if (recent.length >= 5) return { status: 429, body: { error: 'report_limit_reached' } };

  const priority = ['sexual_content', 'minor_safety'].includes(parsed.data.reason) ? 'urgent' : 'normal';
  const id = crypto.randomUUID();
  await db.insert(reports).values({
    id, reporterId, targetType: parsed.data.targetType, targetId: parsed.data.targetId,
    reason: parsed.data.reason, details: parsed.data.details ?? null,
    priority, status: 'open', createdAt: new Date(),
  });
  return { status: 201, body: { id, status: 'open' } };
}

export async function isAdmin(env: Env, userId: string, db = createDatabase(env)): Promise<boolean> {
  if (!await isActive(db, userId)) return false;
  const found = await db.select({ role: adminUsers.role }).from(adminUsers)
    .where(eq(adminUsers.userId, userId)).limit(1);
  return found[0]?.role === 'admin' || found[0]?.role === 'moderator';
}

export async function reportQueue(env: Env, adminId: string, db = createDatabase(env)): Promise<Result> {
  if (!await isAdmin(env, adminId, db)) return { status: 403, body: { error: 'forbidden' } };
  const items = await db.select({
    id: reports.id, targetType: reports.targetType, targetId: reports.targetId,
    reason: reports.reason, priority: reports.priority, createdAt: reports.createdAt,
  }).from(reports).where(eq(reports.status, 'open')).orderBy(desc(reports.createdAt)).limit(100);
  items.sort((a, b) => (a.priority === 'urgent' ? -1 : 1) - (b.priority === 'urgent' ? -1 : 1));
  return { status: 200, body: { reports: items } };
}

export async function reportDetail(env: Env, adminId: string, reportId: string, db = createDatabase(env)): Promise<Result> {
  if (!await isAdmin(env, adminId, db)) return { status: 403, body: { error: 'forbidden' } };
  const found = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!found.length) return { status: 404, body: { error: 'not_found' } };
  return { status: 200, body: { report: found[0] } };
}

export async function reviewReport(env: Env, adminId: string, reportId: string, input: unknown, db = createDatabase(env)): Promise<Result> {
  if (!await isAdmin(env, adminId, db)) return { status: 403, body: { error: 'forbidden' } };
  const parsed = reviewInput.safeParse(input);
  if (!parsed.success) return { status: 400, body: { error: 'invalid_input' } };
  const found = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  const report = found[0];
  if (!report) return { status: 404, body: { error: 'not_found' } };
  if (report.status !== 'open') return { status: 409, body: { error: 'already_reviewed' } };
  if (parsed.data.decision === 'suspend') {
    const targetAdmin = await db.select({ userId: adminUsers.userId }).from(adminUsers)
      .where(eq(adminUsers.userId, report.targetId)).limit(1);
    if (targetAdmin.length) return { status: 403, body: { error: 'admin_target' } };
    if (!await isActive(db, report.targetId)) return { status: 409, body: { error: 'target_inactive' } };
  }

  const now = new Date();
  let resolved = false;
  await db.transaction(async (tx) => {
    const updated = await tx.update(reports).set({
      status: parsed.data.decision === 'dismiss' ? 'dismissed' : 'actioned', resolvedAt: now,
    }).where(and(eq(reports.id, reportId), eq(reports.status, 'open'))).returning({ id: reports.id });
    if (!updated.length) return;
    resolved = true;
    if (parsed.data.decision === 'suspend') {
      await tx.update(users).set({ status: 'suspended', updatedAt: now }).where(eq(users.id, report.targetId));
      await tx.insert(moderationActions).values({
        id: crypto.randomUUID(), targetUserId: report.targetId, actionType: 'suspension',
        reason: parsed.data.reason, moderatorId: adminId, startsAt: now, endsAt: null, createdAt: now,
      });
    }
    await tx.insert(moderationAuditLog).values({
      id: crypto.randomUUID(), actorAdminId: adminId, action: `report_${parsed.data.decision}`,
      targetType: report.targetType, targetId: report.targetId,
      metadata: JSON.stringify({ reportId, reportReason: report.reason, reviewReason: parsed.data.reason }),
      createdAt: now,
    });
  });
  if (!resolved) return { status: 409, body: { error: 'already_reviewed' } };
  return { status: 200, body: { status: parsed.data.decision === 'dismiss' ? 'dismissed' : 'actioned' } };
}
