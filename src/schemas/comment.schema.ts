import { z } from 'zod';

// comment create schema
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty.')
    .max(500, 'Comments must be 500 characters or less.'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
