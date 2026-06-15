import { z } from 'zod';

// env schema
export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),
  // cloudinary
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY:                z.string().min(1).optional(),
  CLOUDINARY_API_SECRET:             z.string().min(1).optional(),
  // ai phase config
  GROQ_API_KEY: z.string().optional(),
  // gh token
  GITHUB_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
