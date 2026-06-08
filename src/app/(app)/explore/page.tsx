import type { Metadata } from 'next';
import { ExploreFeedClient } from './ExploreFeedClient';
import { getDiscoveryFeed } from '@/services/discovery.service';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Explore — Code Afterlife',
  description: 'Discover projects across all lifecycle states in a scrolling feed.',
};

export default async function ExplorePage() {
  const [{ projects, nextCursor }, session] = await Promise.all([
    getDiscoveryFeed(),
    auth(),
  ]);

  const currentUserId = session?.user?.id ?? null;
  const projectIds = projects.map((p) => p.id);

  // Batch-fetch which projects this user has liked/voted — empty sets for guests
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

  const trendingTags = ['react', 'next.js', 'typescript', 'tailwind', 'prisma', 'node.js'];

  return (
    <div className="flex justify-center min-h-screen">
      <ExploreFeedClient
        initialProjects={projects}
        initialCursor={nextCursor}
        trendingTags={trendingTags}
        currentUserId={currentUserId}
        likedProjectIds={likedProjectIds}
        votedProjectIds={votedProjectIds}
      />
    </div>
  );
}
