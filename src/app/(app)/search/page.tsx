import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchClient } from './SearchClient';
import { getSearchPage } from '@/services/search.service';

export const metadata: Metadata = {
  title: 'Search — Code Afterlife',
  description: 'Search projects from developers around the world in every stage of their lifecycle.',
};

function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/40 animate-pulse">
        Loading Search…
      </div>
    </div>
  );
}

// search page
export default async function SearchPage() {
  const { projects, nextCursor } = await getSearchPage({ sort: 'TRENDING' });

  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchClient
        initialProjects={projects}
        initialCursor={nextCursor}
      />
    </Suspense>
  );
}
