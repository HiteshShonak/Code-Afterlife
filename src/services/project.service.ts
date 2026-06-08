import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';
import { generateSlug } from '@/lib/utils';
import { stateMachine } from '@/lib/state-machine';
import { PROJECT_DEFAULTS } from '@/config/project';
import type { Project, ProjectState } from '@prisma/client';
import type { CreateProjectInput, UpdateProjectInput } from '@/schemas/project.schema';
import type { ProjectWithUser, ProjectDetail, ProjectListFilters } from '@/types/project';

export type { ProjectWithUser, ProjectDetail, ProjectListFilters };

/**
 * Fetch a project and verify the given user owns it.
 * Throws ApiError.notFound or ApiError.forbidden if checks fail.
 */
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

/**
 * Generates an AI birth entry and saves it to the timeline.
 */
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

export const projectService = {
  /**
   * Create a new project in BORN state with auto-generated slug.
   * Health starts at the configured initial value (50).
   */
  async create(
    userId: string,
    data: CreateProjectInput
  ): Promise<Project> {
    const baseSlug = generateSlug(data.title);
    const suffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${suffix}`;

    // Create project first so we have its ID
    const project = await prisma.project.create({
      data: {
        title: data.title,
        slug,
        description: data.description ?? null,
        githubRepoUrl: data.repoUrl,
        stack: data.stack,
        screenshots: data.screenshots ?? [],
        state: 'BORN',
        health: PROJECT_DEFAULTS.initialHealth,
        userId,
        lastActivityAt: new Date(),
        lastHealthUpdate: new Date(),
      },
    });

    // Seed the first AI timeline entry in the background — non-blocking
    seedBirthEntry(project.id, project.title, project.description, project.stack).catch(console.error);

    return project;
  },

  /**
   * Get a project by its URL slug with creator, parent, and resurrecter.
   * Used for public project detail pages.
   */
  async getBySlug(slug: string): Promise<ProjectDetail | null> {
    return prisma.project.findUnique({
      where: { slug },
      include: {
        user: true,
        parentProject: true,
        resurrecter: true,
        children: true,
        timeCapsules: true,
        timelineEntries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    }) as Promise<ProjectDetail | null>;
  },

  /**
   * Get a project by ID with creator relation.
   * Used for API detail endpoints.
   */
  async getById(id: string): Promise<ProjectWithUser | null> {
    return prisma.project.findUnique({
      where: { id },
      include: { user: true },
    }) as Promise<ProjectWithUser | null>;
  },

  /**
   * Get a project by ID with full detail relations (parent, resurrecter, children).
   * Used by the /api/projects/[id] GET endpoint.
   */
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

  /**
   * List projects for a specific user, ordered by most recently updated.
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  /**
   * List all dead projects with creator info (for the Graveyard page).
   */
  async getDeadProjects(): Promise<ProjectWithUser[]> {
    return prisma.project.findMany({
      where: { state: 'DEAD' },
      include: { user: true },
      orderBy: { updatedAt: 'desc' },
    }) as Promise<ProjectWithUser[]>;
  },

  /**
   * List projects with optional filters (state, userId).
   * Used by the /api/projects GET endpoint.
   */
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

  /**
   * Transition a project to a new lifecycle state.
   * Validates the transition via the state machine. Setting state to DEAD
   * also clears lastActivityAt and optionally stores a deathReason epitaph.
   */
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

  /**
   * Update health score and timestamp. Called by the health recalculation cron.
   */
  async updateHealth(id: string, health: number): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: {
        health,
        lastHealthUpdate: new Date(),
      },
    });
  },

  /**
   * Mark a project as SHIPPED (terminal state). Verifies ownership first.
   */
  async markAsShipped(id: string, userId: string): Promise<Project> {
    const project = await findOwnedProject(id, userId);
    stateMachine.validateTransition(project.state, 'SHIPPED');

    return prisma.project.update({
      where: { id },
      data: { state: 'SHIPPED' },
    });
  },

  /**
   * Update project metadata (title, description, stack). Verifies ownership.
   */
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

  /**
   * Soft-delete a project by setting its state to DEAD.
   * Accepts an optional epitaph (deathReason) shown on the tombstone.
   * Verifies ownership.
   */
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

  /**
   * Permanently delete a project and all its related data from the database.
   * This is irreversible. Verifies ownership first.
   */
  async hardDelete(id: string, userId: string): Promise<void> {
    await findOwnedProject(id, userId);
    // Cascade deletes handle all related records (timeline, capsules, likes, etc.)
    await prisma.project.delete({ where: { id } });
  },
};
