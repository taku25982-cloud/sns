import { z } from 'zod';

export const registrationStatusSchema = z.object({ enabled: z.boolean() });
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;

export const eventCodes = [
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
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const feedPostSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  username: z.string(),
  displayName: z.string(),
  text: z.string(),
  visibility: z.enum(['public', 'followers']),
  eventTag: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export const feedResponseSchema = z.object({
  posts: z.array(feedPostSchema),
  nextCursor: z.string().nullable(),
});
export type FeedPost = z.infer<typeof feedPostSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;

export const createPostSchema = z.object({
  text: z.string().trim().min(1).max(500),
  visibility: z.enum(['public', 'followers']).default('followers'),
  eventTag: z.enum(eventCodes).nullable().optional(),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;
