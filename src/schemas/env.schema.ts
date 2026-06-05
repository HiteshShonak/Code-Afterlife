import { z } from 'zod';

/** Validates all required environment variables at startup. Throws if any are missing or malformed. */
export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),
  // Cloudinary — required for image uploads (Phase 2A)
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY:                z.string().min(1).optional(),
  CLOUDINARY_API_SECRET:             z.string().min(1).optional(),
  // Phase 2 — optional, only validated when AI features are enabled
  GROQ_API_KEY: z.string().optional(),
  // GitHub token for authenticated API calls (5000 req/hr vs 60 unauthenticated)
  // Generate at https://github.com/settings/tokens — only needs public_repo read scope
  GITHUB_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
