'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth-guard';
import { actionHandler } from '@/lib/async-handler';
import { projectService } from '@/services/project.service';
import { createProjectSchema, updateProjectSchema } from '@/schemas/project.schema';
import { notificationService } from '@/services/notification.service';
import type { Project } from '@prisma/client';

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

export const updateProjectAction = actionHandler(
  async (projectId: string, formData: FormData): Promise<Project> => {
    const user = await requireAuth();

    const rawData: Record<string, unknown> = {};
    const title = formData.get('title');
    const description = formData.get('description');
    const stack = formData.getAll('stack');
    const screenshots = formData.getAll('screenshots');
    const deployedUrl = formData.get('deployedUrl');

    if (title) rawData.title = String(title);
    if (description !== null) rawData.description = String(description);
    if (stack.length > 0) rawData.stack = stack.map(String);
    if (screenshots.length > 0) rawData.screenshots = screenshots.map(String).filter(Boolean);
    if (deployedUrl !== null) rawData.deployedUrl = String(deployedUrl) || null;

    const validated = updateProjectSchema.parse(rawData);
    const project = await projectService.update(projectId, user.id, validated);

    revalidatePath('/');
    revalidatePath(`/project/${project.slug}`);

    return project;
  }
);

export const shipProjectAction = actionHandler(
  async (projectId: string): Promise<Project> => {
    const user = await requireAuth();
    const project = await projectService.markAsShipped(projectId, user.id);

    notificationService.notifyProjectUnsealed(project.id, 'SHIPPED').catch(console.error);

    revalidatePath('/');
    revalidatePath(`/project/${project.slug}`);

    return project;
  }
);

export const deleteProjectAction = actionHandler(
  async (projectId: string): Promise<{ deleted: true }> => {
    const user = await requireAuth();
    await projectService.delete(projectId, user.id, 'Lost to time.');

    notificationService.notifyProjectUnsealed(projectId, 'DEAD').catch(console.error);

    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/graveyard');

    return { deleted: true };
  }
);

export const archiveProjectAction = actionHandler(
  async (projectId: string, rawReason: string): Promise<{ archived: true }> => {
    const user = await requireAuth();

    const DEFAULT_REASONS = [
      'Lost to time.',
      'Abandoned by its creator.',
      'Scope crept into the void.',
      'The rewrite never came.',
      'Burned out before launch.',
    ];
    const deathReason = rawReason?.trim().slice(0, 120) ||
      DEFAULT_REASONS[Math.floor(Math.random() * DEFAULT_REASONS.length)];

    await projectService.delete(projectId, user.id, deathReason);

    notificationService.notifyProjectUnsealed(projectId, 'DEAD').catch(console.error);

    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/graveyard');

    return { archived: true };
  }
);

export const permanentDeleteProjectAction = actionHandler(
  async (projectId: string): Promise<{ deleted: true }> => {
    const user = await requireAuth();
    await projectService.hardDelete(projectId, user.id);

    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/graveyard');

    return { deleted: true };
  }
);
