import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';
import { generateSlug } from '@/lib/utils';
import { PROJECT_DEFAULTS } from '@/config/project';
import type { Project } from '@prisma/client';
import type { ResurrectProjectInput } from '@/schemas/project.schema';

/** A project in the resurrection chain with minimal user info. */
export interface ChainProject {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly state: string;
  readonly parentProjectId: string | null;
  readonly lineageDepth: number;
  readonly user: { username: string | null } | null;
  readonly resurrecter: { username: string | null } | null;
}

export const resurrectionService = {
  /**
   * Resurrect a dead project. Creates a new child project with lineage link.
   *
   * Process:
   * 1. Verify original project exists and is DEAD
   * 2. Generate a unique slug for the new project
   * 3. Create new project + timeline entry in a transaction
   *
   * @throws {ApiError} 404 if project not found
   * @throws {ApiError} 400 if project is not in DEAD state
   */
  async resurrect(
    deadProjectId: string,
    resurrecterUserId: string,
    data: ResurrectProjectInput
  ): Promise<Project> {
    const deadProject = await prisma.project.findUnique({
      where: { id: deadProjectId },
    });

    if (!deadProject) {
      throw ApiError.notFound('Project not found');
    }

    if (deadProject.state !== 'DEAD') {
      throw ApiError.badRequest('Only dead projects can be resurrected');
    }

    const baseSlug = generateSlug(`${deadProject.title} resurrected`);
    const suffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${suffix}`;

    const newProject = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          title: `${deadProject.title} (Resurrected)`,
          slug,
          description: data.description ?? deadProject.description,
          githubRepoUrl: data.repoUrl,
          stack: data.stack ?? deadProject.stack,
          state: 'BORN',
          health: PROJECT_DEFAULTS.initialHealth,
          userId: resurrecterUserId,
          resurrecterUserId,
          parentProjectId: deadProjectId,
          resurrectionDate: new Date(),
          lineageDepth: deadProject.lineageDepth + 1,
          lastActivityAt: new Date(),
          lastHealthUpdate: new Date(),
        },
      });

      // 1. Mark the death in the parent
      await tx.timelineEntry.create({
        data: {
          projectId: deadProjectId,
          type: 'RESURRECTION',
          title: 'Project Resurrected',
          description: 'This project was resurrected. The legacy continues in a new repository.',
        },
      });

      // 2. Mark the rebirth in the child (will appear in feeds as "resurrected ---- project")
      await tx.timelineEntry.create({
        data: {
          projectId: created.id,
          type: 'MILESTONE',
          title: `Resurrected "${deadProject.title}"`,
          description: `The code breathes again. Lineage depth ${created.lineageDepth}.`,
        },
      });

      return created;
    });

    return newProject;
  },

  /**
   * Walk the resurrection chain (ancestor → descendant) for a given project.
   * Returns ordered list from oldest ancestor to the given project.
   */
  async getResurrectionChain(projectId: string): Promise<ChainProject[]> {
    const selectFields = {
      id: true,
      title: true,
      slug: true,
      state: true,
      parentProjectId: true,
      lineageDepth: true,
      user: { select: { username: true } },
      resurrecter: { select: { username: true } },
    } as const;

    const chain: ChainProject[] = [];
    let currentId: string | null = projectId;

    while (currentId) {
      const result: ChainProject | null = await prisma.project.findUnique({
        where: { id: currentId },
        select: selectFields,
      });

      if (!result) break;

      chain.unshift(result);
      currentId = result.parentProjectId;
    }

    return chain;
  },
};
