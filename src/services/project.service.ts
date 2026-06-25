import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';
import { logger } from '@/lib/logger';
import { generateSlug } from '@/lib/utils';
import { stateMachine, type TransitionSource } from '@/lib/state-machine';
import { PROJECT_DEFAULTS } from '@/config/project';
import type { Prisma, Project, ProjectState } from '@prisma/client';
import type { CreateProjectInput, UpdateProjectInput } from '@/schemas/project.schema';
import type { ProjectWithUser, ProjectDetail, ProjectListFilters } from '@/types/project';

export type { ProjectWithUser, ProjectDetail, ProjectListFilters };

export interface UpdateProjectStateOptions {
  readonly source: TransitionSource;
  readonly deathReason?: string;
  readonly tx?: Prisma.TransactionClient;
}

async function findOwnedProject(id: string, userId: string): Promise<Project> {
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    throw ApiError.notFound('Project not found');
  }
  if (project.userId !== userId) {
    throw ApiError.forbidden('You do not own this project');
  }

  return project;
}

async function seedBirthEntry(
  projectId: string,
  title: string,
  description: string | null,
  stack: string[],
): Promise<void> {
  let aiMessage = "A new project was born into the world.";
  
  if (process.env.GROQ_API_KEY) {
    const context = [
      `Project: "${title}"`,
      description ? `\nDescription: ${description.slice(0, 300)}` : '',
      stack.length ? `\nStack: ${stack.join(', ')}` : '',
    ].join('');

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are the archivist for Code Afterlife.
Given a newly created project, write a single short, poetic sentence (max 12 words) announcing its birth.
Tone: cinematic, hopeful, slightly dramatic.
Examples: "A new spark ignites in the void." | "The first lines of code have been written." | "A new journey begins today."
Return ONLY the sentence. No quotes.`,
            },
            { role: 'user', content: context },
          ],
          max_tokens: 30,
          temperature: 0.8,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content?.trim() ?? null;
        if (raw) {
          aiMessage = raw.replace(/^["']|["']$/g, '').slice(0, 120);
        }
      }
    } catch (error) {
      logger.error('Project birth AI timeline text generation failed', { error });
    }
  }

  await prisma.timelineEntry.create({
    data: {
      projectId,
      type: 'AI_BUILD_LOG',
      title: 'Project Born',
      description: aiMessage,
    },
  });
}

function seededInitialHealth(): number {
  const offset = Math.floor(Math.random() * 17) - 8; // -8 … +8
  return PROJECT_DEFAULTS.initialHealth + offset; // 42 … 58
}

function buildStateTimelineEntry(
  projectId: string,
  previousState: ProjectState,
  nextState: ProjectState,
  options: UpdateProjectStateOptions,
): Prisma.TimelineEntryUncheckedCreateInput | null {
  if (previousState === nextState) {
    return null;
  }

  if (options.source === 'health_cron' && nextState === 'STALLED') {
    return {
      projectId,
      type: 'SYSTEM_DECAY',
      title: 'Project Stalled',
      description: 'Development activity has ceased. The codebase is gathering dust.',
      data: {
        from: previousState,
        to: nextState,
        source: options.source,
      },
    };
  }

  if (options.source === 'health_cron' && nextState === 'DEAD') {
    return {
      projectId,
      type: 'SYSTEM_DECAY',
      title: 'Project Died',
      description:
        options.deathReason ??
        'The project has been abandoned. It now rests in the graveyard.',
      data: {
        from: previousState,
        to: nextState,
        source: options.source,
      },
    };
  }

  if (nextState === 'DEAD') {
    return {
      projectId,
      type: 'DEATH',
      title: 'Project Died',
      description:
        options.deathReason ??
        'The project has been abandoned. It now rests in the graveyard.',
      data: {
        from: previousState,
        to: nextState,
        source: options.source,
      },
    };
  }

  return null;
}

export const projectService = {
  async create(
    userId: string,
    data: CreateProjectInput
  ): Promise<Project> {
    const baseSlug = generateSlug(data.title);
    const suffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${suffix}`;
    const startingHealth = seededInitialHealth();

    const project = await prisma.project.create({
      data: {
        title: data.title,
        slug,
        description: data.description ?? null,
        githubRepoUrl: data.repoUrl,
        stack: data.stack,
        screenshots: data.screenshots ?? [],
        state: 'BORN',
        health: startingHealth,
        userId,
        lastActivityAt: new Date(),
        lastHealthUpdate: new Date(),
      },
    });

    seedBirthEntry(project.id, project.title, project.description, project.stack).catch((err) =>
      logger.error(`Failed to seed birth entry for project ${project.id}`, { error: err })
    );

    return project;
  },

  async getBySlug(slug: string): Promise<ProjectDetail | null> {
    return prisma.project.findUnique({
      where: { slug },
      include: {
        user: true,
        parentProject: {
          include: { user: true }
        },
        resurrecter: true,
        children: true,
        timeCapsules: true,
        _count: {
          select: { followers: true },
        },
        timelineEntries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    }) as Promise<ProjectDetail | null>;
  },

  async getById(id: string): Promise<ProjectWithUser | null> {
    return prisma.project.findUnique({
      where: { id },
      include: { user: true },
    }) as Promise<ProjectWithUser | null>;
  },

  async getByIdWithFullRelations(id: string): Promise<ProjectDetail | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        user: true,
        parentProject: true,
        resurrecter: true,
        children: true,
      },
    }) as Promise<ProjectDetail | null>;
  },

  async getUserProjects(userId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getDeadProjects(): Promise<ProjectWithUser[]> {
    return prisma.project.findMany({
      where: { state: 'DEAD' },
      include: { 
        user: true,
        _count: { select: { timeCapsules: true, children: true } }
      },
      orderBy: { updatedAt: 'desc' },
    }) as Promise<ProjectWithUser[]>;
  },

  async list(filters: ProjectListFilters = {}): Promise<ProjectWithUser[]> {
    const where: Record<string, unknown> = {};
    if (filters.state) where.state = filters.state;
    if (filters.userId) where.userId = filters.userId;

    return prisma.project.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    }) as Promise<ProjectWithUser[]>;
  },

  async updateState(
    id: string,
    newState: ProjectState,
    options: UpdateProjectStateOptions,
  ): Promise<Project> {
    const runTransition = async (tx: Prisma.TransactionClient): Promise<Project> => {
      const project = await tx.project.findUnique({ where: { id } });
      if (!project) {
        throw ApiError.notFound('Project not found');
      }

      if (project.state === newState) {
        return project;
      }

      stateMachine.validateTransition(project.state, newState, {
        source: options.source,
      });

      const updateResult = await tx.project.updateMany({
        where: {
          id,
          state: project.state,
        },
        data: {
          state: newState,
          ...(newState === 'DEAD' && options.deathReason
            ? { deathReason: options.deathReason }
            : {}),
        },
      });

      if (updateResult.count !== 1) {
        throw ApiError.conflict('Project state changed during transition. Please retry.');
      }

      const timelineEntry = buildStateTimelineEntry(id, project.state, newState, options);
      if (timelineEntry) {
        await tx.timelineEntry.create({ data: timelineEntry });
      }

      const updated = await tx.project.findUnique({ where: { id } });
      if (!updated) {
        throw ApiError.notFound('Project not found after update');
      }

      return updated;
    };

    if (options.tx) {
      return runTransition(options.tx);
    }

    return prisma.$transaction(runTransition);
  },

  async updateHealth(id: string, health: number): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: {
        health,
        lastHealthUpdate: new Date(),
      },
    });
  },

  async markAsShipped(id: string, userId: string): Promise<Project> {
    await findOwnedProject(id, userId);
    return this.updateState(id, 'SHIPPED', { source: 'manual' });
  },

  async update(
    id: string,
    userId: string,
    data: UpdateProjectInput
  ): Promise<Project> {
    await findOwnedProject(id, userId);

    return prisma.project.update({
      where: { id },
      data,
    });
  },

  async delete(id: string, userId: string, deathReason?: string): Promise<Project> {
    await findOwnedProject(id, userId);
    const finalReason = deathReason ?? 'Lost to time.';
    return this.updateState(id, 'DEAD', {
      source: 'manual',
      deathReason: finalReason,
    });
  },

  async hardDelete(id: string, userId: string): Promise<void> {
    await findOwnedProject(id, userId);
    await prisma.project.delete({ where: { id } });
  },
};
