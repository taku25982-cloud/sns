import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@track-social/db/schema';
import { reportDetail, reportQueue, reviewReport, submitReport } from './safety';

const env = {} as Env;

test('report review is restricted to admins and records suspension with an audit trail', async () => {
  const client = createClient({ url: 'file::memory:' });
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../../../packages/db/drizzle/', import.meta.url)) });
    const now = new Date();
    for (const id of ['reporter', 'target', 'moderator']) {
      await db.insert(schema.authUser).values({ id, name: id, email: `${id}@example.invalid`, createdAt: now, updatedAt: now });
      await db.insert(schema.users).values({
        id, birthDate: '2000-01-01', ageBand: '18+', status: 'active', termsVersion: 'test',
        privacyVersion: 'test', consentAt: now, createdAt: now, updatedAt: now,
      });
    }
    await db.insert(schema.adminUsers).values({ userId: 'moderator', role: 'moderator', createdAt: now });

    const submitted = await submitReport(env, 'reporter', {
      targetType: 'user', targetId: 'target', reason: 'minor_safety', details: 'Report details',
    }, db);
    assert.equal(submitted.status, 201);
    const reportId = submitted.body.id as string;
    assert.equal((await db.select().from(schema.reports).where(eq(schema.reports.id, reportId)))[0]?.priority, 'urgent');
    assert.deepEqual(await submitReport(env, 'reporter', {
      targetType: 'user', targetId: 'target', reason: 'spam',
    }, db), { status: 409, body: { error: 'already_reported' } });

    assert.deepEqual(await reportQueue(env, 'reporter', db), { status: 403, body: { error: 'forbidden' } });
    assert.deepEqual(await reportDetail(env, 'reporter', reportId, db), { status: 403, body: { error: 'forbidden' } });
    assert.deepEqual(await reviewReport(env, 'reporter', reportId, {
      decision: 'suspend', reason: 'Confirmed safety violation',
    }, db), { status: 403, body: { error: 'forbidden' } });
    const queue = await reportQueue(env, 'moderator', db);
    assert.equal(queue.status, 200);
    assert.equal((queue.body.reports as { id: string }[])[0]?.id, reportId);

    assert.deepEqual(await reviewReport(env, 'moderator', reportId, {
      decision: 'suspend', reason: 'Confirmed safety violation',
    }, db), { status: 200, body: { status: 'actioned' } });
    assert.equal((await db.select().from(schema.users).where(eq(schema.users.id, 'target')))[0]?.status, 'suspended');
    assert.equal((await db.select().from(schema.reports).where(eq(schema.reports.id, reportId)))[0]?.status, 'actioned');
    assert.equal((await db.select().from(schema.moderationActions))[0]?.reason, 'Confirmed safety violation');
    const audit = (await db.select().from(schema.moderationAuditLog))[0];
    assert.equal(audit?.action, 'report_suspend');
    assert.deepEqual(JSON.parse(audit!.metadata), {
      reportId, reportReason: 'minor_safety', reviewReason: 'Confirmed safety violation',
    });
    assert.deepEqual(await reviewReport(env, 'moderator', reportId, {
      decision: 'suspend', reason: 'Another review',
    }, db), { status: 409, body: { error: 'already_reviewed' } });
    assert.deepEqual(await submitReport(env, 'reporter', {
      targetType: 'user', targetId: 'target', reason: 'spam',
    }, db), { status: 404, body: { error: 'not_found' } });

    await db.update(schema.users).set({ status: 'suspended' }).where(eq(schema.users.id, 'moderator'));
    assert.deepEqual(await reportQueue(env, 'moderator', db), { status: 403, body: { error: 'forbidden' } });
  } finally {
    client.close();
  }
});
