import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';
import { generateSlug } from '@/lib/utils';
import { stateMachine } from '@/lib/state-machine';
import { PROJECT_DEFAULTS } from '@/config/project';
import type { Project, ProjectState } from '@prisma/client';
import type { CreateProjectInput, UpdateProjectInput } from '@/schemas/project.schema';
import type { ProjectWithUser, ProjectDetail, ProjectListFilters } from '@/types/project';

export type { ProjectWithUser, ProjectDetail, ProjectListFilters };

// get owned project
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

// ai birth entry
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
    } catch {
      // ignore
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

/**
 * Returns a random starting health in the range [42, 58].
 * Pure Math.random — different every time a project is created.
 */
function seededInitialHealth(_seed: string): number {
  const offset = Math.floor(Math.random() * 17) - 8; // -8 … +8
  return PROJECT_DEFAULTS.initialHealth + offset; // 42 … 58
}

export const projectService = {
  // create project
  async create(
    userId: string,
    data: CreateProjectInput
  ): Promise<Project> {
    const baseSlug = generateSlug(data.title);
    const suffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${suffix}`;
    const startingHealth = seededInitialHealth(data.title + userId);

    // create db project
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

    // async ai entry
    seedBirthEntry(project.id, project.title, project.description, project.stack).catch(console.error);

    return project;
  },

  // get by slug
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

  // get by id
  async getById(id: string): Promise<ProjectWithUser | null> {
    return prisma.project.findUnique({
      where: { id },
      include: { user: true },
    }) as Promise<ProjectWithUser | null>;
  },

  // get with full relations
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

  // list user projects
  async getUserProjects(userId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  // get dead projects
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

  // list projects
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

  // update state
  async updateState(id: string, newState: ProjectState, deathReason?: string): Promise<Project> {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    stateMachine.validateTransition(project.state, newState);

    return prisma.project.update({
      where: { id },
      data: {
        state: newState,
        ...(newState === 'DEAD' && { lastActivityAt: null }),
        ...(newState === 'DEAD' && deathReason && { deathReason }),
      },
    });
  },

  // update health
  async updateHealth(id: string, health: number): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: {
        health,
        lastHealthUpdate: new Date(),
      },
    });
  },

  // mark shipped
  async markAsShipped(id: string, userId: string): Promise<Project> {
    const project = await findOwnedProject(id, userId);
    stateMachine.validateTransition(project.state, 'SHIPPED');

    return prisma.project.update({
      where: { id },
      data: { state: 'SHIPPED' },
    });
  },

  // update project
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

  // soft delete
  async delete(id: string, userId: string, deathReason?: string): Promise<Project> {
    await findOwnedProject(id, userId);

    return prisma.project.update({
      where: { id },
      data: {
        state: 'DEAD',
        lastActivityAt: null,
        ...(deathReason ? { deathReason } : {
          // Fall back to a cinematic default if the user didn't provide one
          deathReason: 'Lost to time.',
        }),
      },
    });
  },

  // hard delete
  async hardDelete(id: string, userId: string): Promise<void> {
    await findOwnedProject(id, userId);
    // cascade delete
    await prisma.project.delete({ where: { id } });
  },
};
