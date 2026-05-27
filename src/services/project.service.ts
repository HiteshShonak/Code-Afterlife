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

    return prisma.project.create({
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
        timelineEntries: {
          orderBy: { createdAt: 'desc' },
          take: 20, // last 20 entries
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
   * also clears lastActivityAt.
   */
  async updateState(id: string, newState: ProjectState): Promise<Project> {
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
   * Soft-delete a project by setting its state to DEAD. Verifies ownership.
   */
  async delete(id: string, userId: string): Promise<Project> {
    await findOwnedProject(id, userId);

    return prisma.project.update({
      where: { id },
      data: { state: 'DEAD' },
    });
  },
};
