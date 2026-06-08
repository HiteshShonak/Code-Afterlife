import { prisma } from '@/lib/prisma';
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
      queue = parsed.queue || [];
      seen = parsed.seen || [];
    } catch (e) {
      // invalid cursor, ignore
    }
  }

  // If queue is empty, we need to generate a new batch of recommendations
  if (queue.length === 0) {
    // 1. Trending (highly active)
    const trending = await prisma.project.findMany({
      where: { id: { notIn: seen } },
      orderBy: { trendingScore: 'desc' },
      take: 10,
      select: { id: true },
    });

    // 2. Newest (fresh content)
    const newest = await prisma.project.findMany({
      where: { id: { notIn: seen } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true },
    });

    // 3. Most Liked (popular)
    const mostLiked = await prisma.project.findMany({
      where: { id: { notIn: seen } },
      orderBy: { likeCount: 'desc' },
      take: 10,
      select: { id: true },
    });
    
    // 4. Random (diversity) - using raw query for ORDER BY RANDOM()
    const seenList = seen.length > 0 ? seen.map(id => `'${id}'`).join(',') : "'__none__'";
    const randomRows = await prisma.$queryRawUnsafe<{ id: string }[]>(`
      SELECT id FROM "Project"
      WHERE id NOT IN (${seenList})
      ORDER BY RANDOM()
      LIMIT 10
    `);

    // Combine and deduplicate
    const allIds = new Set<string>();
    trending.forEach((p) => allIds.add(p.id));
    newest.forEach((p) => allIds.add(p.id));
    mostLiked.forEach((p) => allIds.add(p.id));
    randomRows.forEach((p) => allIds.add(p.id));

    queue = Array.from(allIds);

    // Shuffle the queue so it feels fresh and "random" on every reload
    // Fisher-Yates shuffle
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
  }

  // If still empty, there are no more projects to show!
  if (queue.length === 0) {
    return { projects: [], nextCursor: null };
  }

  // Take the next PAGE_SIZE items
  const toShowIds = queue.splice(0, PAGE_SIZE);
  seen.push(...toShowIds);

  // Fetch the full project data for these IDs
  // We must maintain the order of toShowIds!
  const projectsData = await prisma.project.findMany({
    where: { id: { in: toShowIds } },
    include: { user: true },
  });
  
  // Sort projectsData to match the shuffled order in toShowIds
  const projectMap = new Map(projectsData.map((p: any) => [p.id, p]));
  const sortedProjects = toShowIds.map(id => projectMap.get(id)).filter(Boolean) as ProjectWithUser[];

  // Prepare next cursor
  let nextCursor: string | null = null;
  if (queue.length > 0 || sortedProjects.length === PAGE_SIZE) {
    const nextData: DiscoveryCursorData = { queue, seen };
    nextCursor = Buffer.from(JSON.stringify(nextData)).toString('base64');
  }

  return { projects: sortedProjects, nextCursor };
}
