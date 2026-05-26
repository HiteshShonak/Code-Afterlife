import { z } from 'zod';

/** Zod schema for creating a comment. Max 500 chars per product spec. */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty.')
    .max(500, 'Comments must be 500 characters or less.'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
