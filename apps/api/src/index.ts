import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.get('/v1/health', (context) => {
  return context.json({ status: 'ok', environment: context.env.APP_ENV });
});

export default app;
