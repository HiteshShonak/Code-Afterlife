'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth-guard';
import { actionHandler } from '@/lib/async-handler';
import { projectService } from '@/services/project.service';
import { createProjectSchema, updateProjectSchema } from '@/schemas/project.schema';
import type { Project } from '@prisma/client';

/**
 * Create a new project from form data.
 * Validates input, creates project in BORN state, revalidates dashboard.
 */
export const createProjectAction = actionHandler(
  async (formData: FormData): Promise<Project> => {
    const user = await requireAuth();

    const rawData = {
      title:       formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      repoUrl:     formData.get('repoUrl') as string,
      stack:       formData.getAll('stack').map(String),
      screenshots: formData.getAll('screenshots').map(String).filter(Boolean),
    };

    const validated = createProjectSchema.parse(rawData);
    const project = await projectService.create(user.id, validated);

    revalidatePath('/');
    revalidatePath('/dashboard');

    return project;
  }
);

/**
 * Update project metadata (title, description, stack).
 * Verifies ownership via the service layer.
 */
export const updateProjectAction = actionHandler(
  async (projectId: string, formData: FormData): Promise<Project> => {
    const user = await requireAuth();

    const rawData: Record<string, unknown> = {};
    const title = formData.get('title');
    const description = formData.get('description');
    const stack = formData.getAll('stack');

    if (title) rawData.title = String(title);
    if (description !== null) rawData.description = String(description);
    if (stack.length > 0) rawData.stack = stack.map(String);

    const validated = updateProjectSchema.parse(rawData);
    const project = await projectService.update(projectId, user.id, validated);

    revalidatePath('/');
    revalidatePath(`/projects/${projectId}`);

    return project;
  }
);

/**
 * Mark a project as SHIPPED (terminal state).
 * Verifies ownership and validates state transition.
 */
export const shipProjectAction = actionHandler(
  async (projectId: string): Promise<Project> => {
    const user = await requireAuth();
    const project = await projectService.markAsShipped(projectId, user.id);

    revalidatePath('/');
    revalidatePath(`/projects/${projectId}`);

    return project;
  }
);

/**
 * Soft-delete a project by setting state to DEAD.
 * Verifies ownership via the service layer.
 */
export const deleteProjectAction = actionHandler(
  async (projectId: string): Promise<{ deleted: true }> => {
    const user = await requireAuth();
    await projectService.delete(projectId, user.id);

    revalidatePath('/');
    revalidatePath('/dashboard');

    return { deleted: true };
  }
);
