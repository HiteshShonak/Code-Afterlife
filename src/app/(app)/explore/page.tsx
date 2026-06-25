import type { Metadata } from 'next';
import { ExploreFeedClient } from './ExploreFeedClient';
import { getDiscoveryFeed } from '@/services/discovery.service';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Explore | Code Afterlife',
  description: 'Discover projects across all lifecycle states in a scrolling feed.',
};

export default async function ExplorePage() {
  const [{ projects, nextCursor }, session] = await Promise.all([
    getDiscoveryFeed(),
    auth(),
  ]);

  // Fetch the top 3 most-liked projects for the @mention section
  const trendingProjects = await prisma.project.findMany({
    orderBy: { likes: { _count: 'desc' } },
    take: 3,
    select: { title: true, slug: true },
  });

  const currentUserId = session?.user?.id ?? null;
  const projectIds = projects.map((p) => p.id);

  // Batch-fetch which projects this user has liked/voted - empty sets for guests
  let likedProjectIds: string[] = [];
  let votedProjectIds: string[] = [];

  if (currentUserId && projectIds.length > 0) {
    const [likes, votes] = await Promise.all([
      prisma.projectLike.findMany({
        where: { userId: currentUserId, projectId: { in: projectIds } },
        select: { projectId: true },
      }),
      prisma.projectVote.findMany({
        where: { userId: currentUserId, projectId: { in: projectIds }, vote: 'WILL_SHIP' },
        select: { projectId: true },
      }),
    ]);
    likedProjectIds = likes.map((l) => l.projectId);
    votedProjectIds = votes.map((v) => v.projectId);
  }

  // Compute dynamic trending tags from fetched projects
  const rawTags: string[] = [];
  projects.forEach((p, idx) => {
    // Add all tech stack items
    p.stack.forEach((tech) => rawTags.push(tech.toLowerCase()));
    // Mix in project names occasionally (or if they are short)
    if (idx % 2 === 0 || p.title.length < 15) {
      const nameTag = p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (nameTag) rawTags.push(nameTag);
    }
  });

  // Calculate frequency to find true "trending" items
  const tagCounts = rawTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let trendingTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1]) // highest frequency first
    .map((entry) => entry[0])
    .slice(0, 6);

  // Pad with fallbacks if there aren't enough unique tags
  const fallbacks = ['react', 'next.js', 'typescript', 'tailwind', 'prisma', 'node.js'];
  if (trendingTags.length < 6) {
    const extra = fallbacks.filter((f) => !trendingTags.includes(f)).slice(0, 6 - trendingTags.length);
    trendingTags = [...trendingTags, ...extra];
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 justify-center overflow-x-clip">
      <ExploreFeedClient
        initialProjects={projects}
        initialCursor={nextCursor}
        trendingTags={trendingTags}
        trendingProjects={trendingProjects}
        currentUserId={currentUserId}
        likedProjectIds={likedProjectIds}
        votedProjectIds={votedProjectIds}
      />
    </div>
  );
}
