import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { expo } from '@better-auth/expo';
import * as schema from '@track-social/db/schema';
import { createDatabase } from './db';

type OAuthEnv = Env & {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;
  APPLE_APP_BUNDLE_IDENTIFIER?: string;
};

export function createAuth(env: OAuthEnv, allowSignUp = false) {
  const db = createDatabase(env);
  const google = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, disableSignUp: !allowSignUp }
    : undefined;
  const apple = env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
    ? {
        clientId: env.APPLE_CLIENT_ID,
        clientSecret: env.APPLE_CLIENT_SECRET,
        appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER,
        disableSignUp: !allowSignUp,
      }
    : undefined;

  return betterAuth({
    appName: '陸上SNS',
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.authUser,
        session: schema.authSession,
        account: schema.authAccount,
        verification: schema.authVerification,
      },
    }),
    emailAndPassword: { enabled: false },
    socialProviders: { ...(google ? { google } : {}), ...(apple ? { apple } : {}) },
    trustedOrigins: ['tracksocial://', 'https://appleid.apple.com'],
    plugins: [expo()],
  });
}
