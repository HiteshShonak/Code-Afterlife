import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchClient } from './SearchClient';
import { getSearchPage } from '@/services/search.service';

export const metadata: Metadata = {
  title: 'Search | Code Afterlife',
  description: 'Search projects from developers around the world in every stage of their lifecycle.',
};

function SearchSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-32 pt-10 md:px-10 min-h-screen">
      {/* Hero */}
      <div className="mb-12 animate-pulse">
        <div className="mb-2 h-3 w-40 bg-muted-foreground/20 rounded" />
        <div className="h-10 w-64 bg-foreground/10 rounded-lg mb-4" />
        <div className="h-4 w-96 max-w-full bg-muted-foreground/10 rounded" />
      </div>

      {/* Filter Bar */}
      <div className="mb-8 space-y-4 animate-pulse">
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-full border border-border/50 bg-card/40" />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 flex-1 rounded-xl border border-border/60 bg-card/60" />
          <div className="h-10 w-32 rounded-xl border border-border/60 bg-card/60" />
          <div className="h-10 w-20 rounded-xl border border-border/60 bg-card/60" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[380px] w-full rounded-2xl border border-border/50 bg-card/40" />
        ))}
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
