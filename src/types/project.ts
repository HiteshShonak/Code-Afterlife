import type { Project, User, ProjectState, TimelineEntry, TimeCapsule } from '@prisma/client';

export { ProjectState } from '@prisma/client';

// project + owner
export type ProjectWithUser = Project & {
  user: User;
};

// parent project shape - always fetched with its owner
export type ProjectParent = Project & {
  user: User;
};

// project + lineage
export type ProjectWithLineage = Project & {
  parentProject: ProjectParent | null;
  children: Project[];
};

// full project details
export type ProjectDetail = Project & {
  user: User;
  parentProject: ProjectParent | null;
  resurrecter: User | null;
  children: Project[];
  timelineEntries: TimelineEntry[];
  timeCapsules: TimeCapsule[];
  _count?: {
    followers: number;
  };
};

// list filters
export interface ProjectListFilters {
  state?: ProjectState;
  userId?: string;
}

// create input
export interface ProjectCreateInput {
  title: string;
  description?: string;
  repoUrl?: string;
  stack: string[];
}
