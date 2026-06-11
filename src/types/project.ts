import type { Project, User, ProjectState, TimelineEntry, TimeCapsule } from '@prisma/client';

export { ProjectState } from '@prisma/client';

/** Project with its owner user relation included. */
export type ProjectWithUser = Project & {
  user: User;
};

/** Project with lineage relations — parent and children. */
export type ProjectWithLineage = Project & {
  parentProject: Project | null;
  children: Project[];
};

/** Project with full detail relations used on the project detail page. */
export type ProjectDetail = Project & {
  user: User;
  parentProject: Project | null;
  resurrecter: User | null;
  children: Project[];
  timelineEntries: TimelineEntry[];
  timeCapsules: TimeCapsule[];
  _count?: {
    followers: number;
  };
};

/** Filters accepted by the project list endpoint. */
export interface ProjectListFilters {
  state?: ProjectState;
  userId?: string;
}

/**
 * Fields required to create a new project.
 * Mirrors the Zod `createProjectSchema` shape for use in frontend form typings.
 */
export interface ProjectCreateInput {
  title: string;
  description?: string;
  repoUrl?: string;
  stack: string[];
}
