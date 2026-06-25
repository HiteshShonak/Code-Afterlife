import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { ProjectWithUser } from '@/types/project';

const PAGE_SIZE = 20;

interface DiscoveryCursorData {
  queue: string[];
  seen: string[];
}

export async function getDiscoveryFeed(
  cursorStr?: string
): Promise<{ projects: ProjectWithUser[]; nextCursor: string | null }> {
  let queue: string[] = [];
  let seen: string[] = [];

  if (cursorStr) {
    try {
      const parsed = JSON.parse(Buffer.from(cursorStr, 'base64').toString('utf-8')) as DiscoveryCursorData;
      queue = Array.isArray(parsed.queue) ? parsed.queue.filter((id) => typeof id === 'string') : [];
      seen = Array.isArray(parsed.seen) ? parsed.seen.filter((id) => typeof id === 'string') : [];
    } catch {
    }
  }

  if (queue.length === 0) {
    const trending = await prisma.project.findMany({
      where: { id: { notIn: seen } },
      orderBy: { trendingScore: 'desc' },
      take: 10,
      select: { id: true },
    });

    const newest = await prisma.project.findMany({
      where: { id: { notIn: seen } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true },
    });

    const mostLiked = await prisma.project.findMany({
      where: { id: { notIn: seen } },
      orderBy: { likeCount: 'desc' },
      take: 10,
      select: { id: true },
    });
    
    const randomRows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM "Project"
      WHERE id NOT IN (${Prisma.join(seen.length > 0 ? seen : ['__none__'])})
      ORDER BY RANDOM()
      LIMIT 10
    `);

    const allIds = new Set<string>();
    trending.forEach((p) => allIds.add(p.id));
    newest.forEach((p) => allIds.add(p.id));
    mostLiked.forEach((p) => allIds.add(p.id));
    randomRows.forEach((p) => allIds.add(p.id));

    queue = Array.from(allIds);

    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
  }

  if (queue.length === 0) {
    return { projects: [], nextCursor: null };
  }

  const toShowIds = queue.splice(0, PAGE_SIZE);
  seen.push(...toShowIds);

  const projectsData = await prisma.project.findMany({
    where: { id: { in: toShowIds } },
    include: { user: true },
  });
  
  const projectMap = new Map(projectsData.map((p) => [p.id, p]));
  const sortedProjects = toShowIds.map(id => projectMap.get(id)).filter(Boolean) as ProjectWithUser[];

  let nextCursor: string | null = null;
  if (queue.length > 0 || sortedProjects.length === PAGE_SIZE) {
    const nextData: DiscoveryCursorData = { queue, seen };
    nextCursor = Buffer.from(JSON.stringify(nextData)).toString('base64');
  }

  return { projects: sortedProjects, nextCursor };
}
