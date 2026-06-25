import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  AUTH_TRUST_HOST: z.string().optional(),
  NEXTAUTH_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY:                z.string().min(1).optional(),
  CLOUDINARY_API_SECRET:             z.string().min(1).optional(),
  GROQ_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CONTACT_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;
