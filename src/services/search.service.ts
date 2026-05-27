import { prisma } from '@/lib/prisma';
import type { ProjectWithUser } from '@/types/project';
import type { ProjectState } from '@prisma/client';

export interface SearchFilters {
  state?:   ProjectState;
  stacks?:  string[];
  search?:  string;
  sort?:    'TRENDING' | 'NEWEST' | 'HEALTH' | 'MOST_LIKED';
  cursor?:  string;
}

const PAGE_SIZE = 25;

export interface SearchPage {
  projects:   ProjectWithUser[];
  nextCursor: string | null;
}

/**
 * Paginated public project feed for the Search page.
 * Cursor-based (by id) so pages are stable and Neon-friendly.
 * Filters: state, tech stack, keyword, sort.
 */
export async function getSearchPage(
  filters: SearchFilters = {}
): Promise<SearchPage> {
  const { state, stacks, search, sort = 'TRENDING', cursor } = filters;

  const where: Record<string, unknown> = {};

  if (state) {
    where.state = state;
  }

  if (stacks && stacks.length > 0) {
    // All selected stacks must appear in the project's stack array
    where.stack = { hasSome: stacks };
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { title:       { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { stack:       { hasSome: [term] } },
    ];
  }

  const orderBy = (() => {
    switch (sort) {
      case 'TRENDING':   return { trendingScore: 'desc' as const };
      case 'NEWEST':     return { createdAt:     'desc' as const };
      case 'HEALTH':     return { health:         'desc' as const };
      case 'MOST_LIKED': return { likeCount:      'desc' as const };
      default:           return { trendingScore: 'desc' as const };
    }
  })();

  const projects = await prisma.project.findMany({
    where,
    orderBy,
    take: PAGE_SIZE + 1, // fetch one extra to detect next page
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { user: true },
  });

  const hasNextPage = projects.length > PAGE_SIZE;
  const page        = hasNextPage ? projects.slice(0, PAGE_SIZE) : projects;
  const nextCursor  = hasNextPage ? page[page.length - 1].id : null;

  return { projects: page as ProjectWithUser[], nextCursor };
}
