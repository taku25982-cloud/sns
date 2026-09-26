import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { authUser, featureFlags, profiles, userEvents, users } from '@track-social/db/schema';
import { ageBand, ageOnDate, todayInJapan } from './age';
import { createDatabase } from './db';

const eventCodes = [
  '100m', '200m', '400m', '800m', '1500m', '3000m', '5000m', '10000m',
  'hurdles', 'steeplechase', 'relay', 'long_jump', 'high_jump', 'triple_jump',
  'pole_vault', 'shot_put', 'discus', 'javelin', 'hammer', 'combined', 'race_walk',
] as const;
const reservedUsernames = new Set(['admin', 'support', 'help', 'official', 'moderator', 'system']);

export const onboardingSchema = z.object({
  birthDate: z.string(),
  displayName: z.string().trim().min(1).max(40),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/)
    .refine((name) => !reservedUsernames.has(name)),
  eventCodes: z.array(z.enum(eventCodes)).min(1).max(10),
  acceptTerms: z.literal(true),
  acceptPrivacy: z.literal(true),
});

export async function completeOnboarding(env: Env, authUserId: string, input: unknown) {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { status: 400 as const, body: { error: 'invalid_input' } };

  const age = ageOnDate(parsed.data.birthDate, todayInJapan());
  if (age === null) return { status: 400 as const, body: { error: 'invalid_birth_date' } };

  const db = createDatabase(env);
  if (age < 13) {
    await db.delete(authUser).where(eq(authUser.id, authUserId));
    return { status: 403 as const, body: { error: 'under_13' } };
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, authUserId)).limit(1);
  if (existing.length) return { status: 409 as const, body: { error: 'already_onboarded' } };

  const existingUsername = await db.select({ userId: profiles.userId }).from(profiles)
    .where(eq(profiles.username, parsed.data.username)).limit(1);
  if (existingUsername.length) return { status: 409 as const, body: { error: 'username_taken' } };

  const now = new Date();
  const band = ageBand(age)!;
  const uniqueEvents = [...new Set(parsed.data.eventCodes)];
  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: authUserId,
        birthDate: parsed.data.birthDate,
        ageBand: band,
        status: 'active',
        termsVersion: 'draft-2026-09-26',
        privacyVersion: 'draft-2026-09-26',
        consentAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(profiles).values({
        userId: authUserId,
        username: parsed.data.username,
        displayName: parsed.data.displayName,
        isPrivate: age < 18,
        dmPolicy: 'following',
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(userEvents).values(uniqueEvents.map((eventCode, priority) => ({
        userId: authUserId, eventCode, priority,
      })));
    });
  } catch (error) {
    // Unique constraints protect concurrent onboarding and username claims.
    if (error instanceof Error && /UNIQUE|constraint/i.test(error.message)) {
      return { status: 409 as const, body: { error: 'conflict' } };
    }
    throw error;
  }

  return { status: 201 as const, body: { username: parsed.data.username, ageBand: band, isPrivate: age < 18 } };
}

export async function getMyProfile(env: Env, authUserId: string) {
  const db = createDatabase(env);
  const rows = await db.select({
    id: users.id, status: users.status, birthDate: users.birthDate,
    username: profiles.username, displayName: profiles.displayName,
    isPrivate: profiles.isPrivate,
  }).from(users).innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.id, authUserId)).limit(1);
  if (!rows.length) return { id: authUserId, onboardingComplete: false };

  if (rows[0].status !== 'active') {
    return { id: authUserId, onboardingComplete: true, status: rows[0].status };
  }

  const events = await db.select({ eventCode: userEvents.eventCode }).from(userEvents)
    .where(eq(userEvents.userId, authUserId));
  const { birthDate, ...profile } = rows[0];
  const age = ageOnDate(birthDate, todayInJapan());
  return {
    ...profile,
    ageBand: age === null ? null : ageBand(age),
    onboardingComplete: true,
    eventCodes: events.map((event) => event.eventCode),
  };
}

export async function isRegistrationEnabled(env: Env): Promise<boolean> {
  const db = createDatabase(env);
  const rows = await db.select({ enabled: featureFlags.enabled }).from(featureFlags)
    .where(eq(featureFlags.key, 'registration_enabled')).limit(1);
  return rows[0]?.enabled ?? false;
}

export async function updatePrivacy(env: Env, authUserId: string, input: unknown) {
  const parsed = z.object({
    isPrivate: z.boolean(),
    acknowledgePublicRisks: z.boolean().optional(),
  }).safeParse(input);
  if (!parsed.success) return { status: 400 as const, body: { error: 'invalid_input' } };

  const db = createDatabase(env);
  const rows = await db.select({ birthDate: users.birthDate, status: users.status }).from(users)
    .where(eq(users.id, authUserId)).limit(1);
  if (!rows.length || rows[0].status !== 'active') {
    return { status: 403 as const, body: { error: 'onboarding_required' } };
  }
  const age = ageOnDate(rows[0].birthDate, todayInJapan());
  if (age === null) return { status: 500 as const, body: { error: 'invalid_account_age' } };
  if (!parsed.data.isPrivate && age < 16) {
    return { status: 403 as const, body: { error: 'public_account_unavailable' } };
  }
  if (!parsed.data.isPrivate && age < 18 && !parsed.data.acknowledgePublicRisks) {
    return { status: 400 as const, body: { error: 'confirmation_required' } };
  }

  await db.update(profiles).set({ isPrivate: parsed.data.isPrivate, updatedAt: new Date() })
    .where(eq(profiles.userId, authUserId));
  return { status: 200 as const, body: { isPrivate: parsed.data.isPrivate } };
}

export async function usernameAvailable(env: Env, value: string): Promise<boolean> {
  const parsed = onboardingSchema.shape.username.safeParse(value);
  if (!parsed.success) return false;
  const db = createDatabase(env);
  const rows = await db.select({ userId: profiles.userId }).from(profiles)
    .where(eq(profiles.username, parsed.data)).limit(1);
  return rows.length === 0;
}
