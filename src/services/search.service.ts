import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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

interface RelevanceCursor {
  offset: number;
  q: string;
}

export interface SearchPage {
  projects:   ProjectWithUser[];
  nextCursor: string | null;
}

function encodeRelevanceCursor(cursor: RelevanceCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

function decodeRelevanceCursor(cursor?: string): RelevanceCursor | null {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as Partial<RelevanceCursor>;
    if (
      typeof parsed.offset === 'number' &&
      Number.isFinite(parsed.offset) &&
      parsed.offset >= 0 &&
      typeof parsed.q === 'string'
    ) {
      return { offset: parsed.offset, q: parsed.q };
    }
  } catch {
    return null;
  }

  return null;
}

function getSecondaryOrder(sort: NonNullable<SearchFilters['sort']>): Prisma.Sql {
  switch (sort) {
    case 'NEWEST':
      return Prisma.sql`"createdAt" DESC`;
    case 'HEALTH':
      return Prisma.sql`"health" DESC`;
    case 'MOST_LIKED':
      return Prisma.sql`"likeCount" DESC`;
    case 'TRENDING':
    default:
      return Prisma.sql`"trendingScore" DESC`;
  }
}

async function getWeightedSearchPage(
  filters: SearchFilters & { search: string }
): Promise<SearchPage> {
  const { state, stacks, search, sort = 'TRENDING', cursor } = filters;
  const term = search.trim();
  const pattern = `%${term}%`;
  const prefixPattern = `${term}%`;
  const relevanceCursor = decodeRelevanceCursor(cursor);
  const offset = relevanceCursor && relevanceCursor.q === term ? relevanceCursor.offset : 0;
  const secondaryOrder = getSecondaryOrder(sort);

  const conditions: Prisma.Sql[] = [
    Prisma.sql`(
      "title" ILIKE ${pattern}
      OR "description" ILIKE ${pattern}
      OR "summary" ILIKE ${pattern}
      OR EXISTS (
        SELECT 1
        FROM unnest("stack") AS tech
        WHERE tech ILIKE ${pattern}
      )
    )`,
  ];

  if (state) {
    conditions.push(Prisma.sql`"state"::text = ${state}`);
  }

  if (stacks && stacks.length > 0) {
    conditions.push(Prisma.sql`"stack" && ${stacks}`);
  }

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT "id"
    FROM (
      SELECT
        "id",
        (
          CASE WHEN lower("title") = lower(${term}) THEN 120 ELSE 0 END +
          CASE WHEN "title" ILIKE ${prefixPattern} THEN 90 ELSE 0 END +
          CASE WHEN "title" ILIKE ${pattern} THEN 70 ELSE 0 END +
          CASE WHEN "description" ILIKE ${pattern} THEN 35 ELSE 0 END +
          CASE WHEN "summary" ILIKE ${pattern} THEN 25 ELSE 0 END +
          CASE WHEN EXISTS (
            SELECT 1
            FROM unnest("stack") AS tech
            WHERE lower(tech) = lower(${term})
          ) THEN 24 ELSE 0 END +
          CASE WHEN EXISTS (
            SELECT 1
            FROM unnest("stack") AS tech
            WHERE tech ILIKE ${pattern}
          ) THEN 16 ELSE 0 END
        ) AS "_searchScore",
        "trendingScore",
        "createdAt",
        "health",
        "likeCount"
      FROM "Project"
      WHERE ${Prisma.join(conditions, ' AND ')}
    ) ranked
    ORDER BY "_searchScore" DESC, ${secondaryOrder}, "id" ASC
    OFFSET ${offset}
    LIMIT ${PAGE_SIZE + 1}
  `);

  const hasNextPage = rows.length > PAGE_SIZE;
  const pageRows = hasNextPage ? rows.slice(0, PAGE_SIZE) : rows;
  const ids = pageRows.map((row) => row.id);

  if (ids.length === 0) {
    return { projects: [], nextCursor: null };
  }

  const projects = await prisma.project.findMany({
    where: { id: { in: ids } },
    include: { user: true },
  });
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const orderedProjects = ids
    .map((id) => projectMap.get(id))
    .filter((project): project is typeof projects[number] => Boolean(project));

  return {
    projects: orderedProjects as ProjectWithUser[],
    nextCursor: hasNextPage
      ? encodeRelevanceCursor({ q: term, offset: offset + PAGE_SIZE })
      : null,
  };
}

// search feed
export async function getSearchPage(
  filters: SearchFilters = {}
): Promise<SearchPage> {
  const { state, stacks, search, sort = 'TRENDING', cursor } = filters;

  if (search && search.trim().length > 0) {
    return getWeightedSearchPage({
      ...filters,
      search,
      sort,
    });
  }

  const where: Record<string, unknown> = {};

  if (state) {
    where.state = state;
  }

  if (stacks && stacks.length > 0) {
    // match all stacks
    where.stack = { hasSome: stacks };
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
    take: PAGE_SIZE + 1, // get extra for pagination
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { user: true },
  });

  const hasNextPage = projects.length > PAGE_SIZE;
  const page        = hasNextPage ? projects.slice(0, PAGE_SIZE) : projects;
  const nextCursor  = hasNextPage ? page[page.length - 1].id : null;

  return { projects: page as ProjectWithUser[], nextCursor };
}
