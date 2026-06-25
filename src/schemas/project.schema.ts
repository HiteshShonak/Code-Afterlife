import { z } from 'zod';

// new project schema
export const createProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  repoUrl: z
    .string()
    .url('A valid GitHub repo URL is required'),
  stack: z
    .array(z.string().min(1))
    .min(1, 'Select at least one technology')
    .max(15, 'Maximum 15 technologies'),
  screenshots: z
    .array(z.string().url('Must be a valid Cloudinary URL'))
    .min(1, 'Add at least 1 screenshot')
    .max(5, 'Maximum 5 screenshots')
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// update schema
export const updateProjectSchema = createProjectSchema.omit({ repoUrl: true }).partial().extend({
  testament: z.string().max(2000, 'Testament must be at most 2000 characters').optional().nullable(),
  timeCapsule: z.string().max(2000, 'Message must be at most 2000 characters').optional().nullable(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// resurrect schema
export const resurrectProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  repoUrl: z
    .string()
    .url('Must be a valid GitHub repository URL'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  screenshots: z
    .array(z.string().url('Must be a valid Cloudinary URL'))
    .min(1, 'Add at least 1 screenshot')
    .max(5, 'Maximum 5 screenshots'),
  stack: z
    .array(z.string().min(1))
    .min(1)
    .max(15)
    .optional(),
});

export type ResurrectProjectInput = z.infer<typeof resurrectProjectSchema>;

// update state schema
export const updateStateSchema = z.object({
  state: z.enum(['BORN', 'ACTIVE', 'STALLED', 'SHIPPED', 'DEAD'], {
    error: 'Invalid project state',
  }),
});

export type UpdateStateInput = z.infer<typeof updateStateSchema>;
