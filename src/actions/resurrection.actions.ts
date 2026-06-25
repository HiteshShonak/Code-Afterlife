'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth-guard';
import { actionHandler } from '@/lib/async-handler';
import { resurrectionService } from '@/services/resurrection.service';
import { resurrectProjectSchema } from '@/schemas/project.schema';
import type { Project } from '@prisma/client';

// resurrect project action
export const resurrectProjectAction = actionHandler(
  async (deadProjectId: string, formData: FormData): Promise<Project> => {
    const user = await requireAuth();

    const rawData = {
      title: formData.get('title') as string,
      repoUrl: formData.get('repoUrl') as string,
      description: (formData.get('description') as string) || undefined,
      screenshots: formData.getAll('screenshots').map(String).filter(Boolean),
      stack: formData.getAll('stack').map(String),
    };

    const validated = resurrectProjectSchema.parse(rawData);

    const newProject = await resurrectionService.resurrect(
      deadProjectId,
      user.id,
      validated
    );

    revalidatePath('/graveyard');
    revalidatePath('/lineage');
    revalidatePath('/');

    return newProject;
  }
);
