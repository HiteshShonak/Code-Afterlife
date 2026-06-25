import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';
import { generateSlug } from '@/lib/utils';
import { PROJECT_DEFAULTS } from '@/config/project';
import type { Project } from '@prisma/client';
import type { ResurrectProjectInput } from '@/schemas/project.schema';

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

function seededInitialHealth(): number {
  const offset = Math.floor(Math.random() * 17) - 8; // -8 … +8
  return PROJECT_DEFAULTS.initialHealth + offset;     // 42 … 58
}

export const resurrectionService = {
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

    const baseSlug = generateSlug(data.title);
    const suffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${suffix}`;

    const newProject = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          title: data.title,
          slug,
          description: data.description ?? deadProject.description,
          githubRepoUrl: data.repoUrl,
          stack: data.stack ?? deadProject.stack,
          screenshots: data.screenshots,
          state: 'BORN',
          health: seededInitialHealth(),
          userId: resurrecterUserId,
          resurrecterUserId,
          parentProjectId: deadProjectId,
          resurrectionDate: new Date(),
          lineageDepth: deadProject.lineageDepth + 1,
          lastActivityAt: new Date(),
          lastHealthUpdate: new Date(),
        },
      });

      await tx.timelineEntry.create({
        data: {
          projectId: deadProjectId,
          type: 'RESURRECTION',
          title: 'Project Resurrected',
          description: 'This project was resurrected. The legacy continues in a new repository.',
        },
      });

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

    const root = await prisma.project.findUnique({
      where: { id: projectId },
      select: selectFields,
    });

    if (!root) return [];

    const chain: ChainProject[] = [];
    let current: ChainProject | null = root;

    while (current) {
      chain.unshift(current);
      if (!current.parentProjectId) break;
      current = await prisma.project.findUnique({
        where: { id: current.parentProjectId },
        select: selectFields,
      });
    }

    return chain;
  },
};
