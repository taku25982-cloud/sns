import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { createAuth } from './auth';
import { completeOnboarding, getMyProfile, isRegistrationEnabled, updatePrivacy, usernameAvailable } from './onboarding';
import { follow, pendingFollowRequests, resolveFollowRequest, setBlock, setMute, unfollow } from './social';
import { reportDetail, reportQueue, reviewReport, submitReport } from './safety';

const app = new Hono<{ Bindings: Env }>();

app.get('/v1/health', (context) => {
  return context.json({ status: 'ok', environment: context.env.APP_ENV });
});

app.all('/api/auth/*', async (context) => {
  const allowSignUp = await isRegistrationEnabled(context.env);
  return createAuth(context.env, allowSignUp).handler(context.req.raw);
});

app.get('/v1/me', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);

  return context.json(await getMyProfile(context.env, session.user.id));
});

app.post('/v1/onboarding', bodyLimit({ maxSize: 8 * 1024 }), async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);

  let input: unknown;
  try {
    input = await context.req.json();
  } catch {
    return context.json({ error: 'invalid_json' }, 400);
  }
  const result = await completeOnboarding(context.env, session.user.id, input);
  return context.json(result.body, result.status);
});

app.get('/v1/usernames/:username/availability', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const available = await usernameAvailable(context.env, context.req.param('username'));
  return context.json({ available });
});

app.patch('/v1/me/privacy', bodyLimit({ maxSize: 1024 }), async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);

  let input: unknown;
  try {
    input = await context.req.json();
  } catch {
    return context.json({ error: 'invalid_json' }, 400);
  }
  const result = await updatePrivacy(context.env, session.user.id, input);
  return context.json(result.body, result.status);
});

app.get('/v1/me/follow-requests', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await pendingFollowRequests(context.env, session.user.id);
  return context.json(result.body, result.status);
});

app.post('/v1/users/:id/follow', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await follow(context.env, session.user.id, context.req.param('id'));
  return context.json(result.body, result.status);
});

app.delete('/v1/users/:id/follow', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await unfollow(context.env, session.user.id, context.req.param('id'));
  return context.json(result.body, result.status);
});

app.post('/v1/follow-requests/:requesterId/accept', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await resolveFollowRequest(context.env, session.user.id, context.req.param('requesterId'), true);
  return context.json(result.body, result.status);
});

app.post('/v1/follow-requests/:requesterId/reject', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await resolveFollowRequest(context.env, session.user.id, context.req.param('requesterId'), false);
  return context.json(result.body, result.status);
});

app.post('/v1/users/:id/block', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await setBlock(context.env, session.user.id, context.req.param('id'), true);
  return context.json(result.body, result.status);
});

app.delete('/v1/users/:id/block', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await setBlock(context.env, session.user.id, context.req.param('id'), false);
  return context.json(result.body, result.status);
});

app.post('/v1/users/:id/mute', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await setMute(context.env, session.user.id, context.req.param('id'), true);
  return context.json(result.body, result.status);
});

app.delete('/v1/users/:id/mute', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await setMute(context.env, session.user.id, context.req.param('id'), false);
  return context.json(result.body, result.status);
});

app.post('/v1/reports', bodyLimit({ maxSize: 4 * 1024 }), async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  let input: unknown;
  try {
    input = await context.req.json();
  } catch {
    return context.json({ error: 'invalid_json' }, 400);
  }
  const result = await submitReport(context.env, session.user.id, input);
  return context.json(result.body, result.status);
});

app.get('/v1/admin/reports', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await reportQueue(context.env, session.user.id);
  return context.json(result.body, result.status);
});

app.get('/v1/admin/reports/:id', async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  const result = await reportDetail(context.env, session.user.id, context.req.param('id'));
  return context.json(result.body, result.status);
});

app.post('/v1/admin/reports/:id/review', bodyLimit({ maxSize: 4 * 1024 }), async (context) => {
  const session = await createAuth(context.env).api.getSession({ headers: context.req.raw.headers });
  if (!session) return context.json({ error: 'unauthorized' }, 401);
  let input: unknown;
  try {
    input = await context.req.json();
  } catch {
    return context.json({ error: 'invalid_json' }, 400);
  }
  const result = await reviewReport(context.env, session.user.id, context.req.param('id'), input);
  return context.json(result.body, result.status);
});

app.onError((error, context) => {
  console.error(JSON.stringify({ error: 'request_failed', path: context.req.path, type: error.name }));
  return context.json({ error: 'internal_error' }, 500);
});

export default app;
