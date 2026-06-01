import type { Metadata } from 'next';
import { ExploreFeedClient } from './ExploreFeedClient';
import { getDiscoveryFeed } from '@/services/discovery.service';

export const metadata: Metadata = {
  title: 'Explore — Code Afterlife',
  description: 'Discover projects across all lifecycle states in a scrolling feed.',
};

/**
 * The Explore feed page - Twitter-style vertical scrolling feed.
 * Data is fetched server-side for instant initial load.
 */
export default async function ExplorePage() {
  const { projects, nextCursor } = await getDiscoveryFeed();

  // Trending tags — in a future phase these will be computed dynamically
  const trendingTags = ['react', 'next.js', 'typescript', 'tailwind', 'prisma', 'node.js'];

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      <ExploreFeedClient
        initialProjects={projects}
        initialCursor={nextCursor}
        trendingTags={trendingTags}
      />
    </div>
  );
}
