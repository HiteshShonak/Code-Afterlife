import type { Metadata } from 'next';
import { SearchClient } from './SearchClient';
import { getSearchPage } from '@/services/search.service';

export const metadata: Metadata = {
  title: 'Search — Code Afterlife',
  description: 'Search projects from developers around the world in every stage of their lifecycle.',
};

/**
 * Search page — inside (app) shell so authenticated users see the sidebar.
 * Public: unauthenticated users still see this page (layout handles session gracefully).
 * Server component fetches the first page sorted by trending.
 */
export default async function SearchPage() {
  const { projects, nextCursor } = await getSearchPage({ sort: 'TRENDING' });

  return (
    <SearchClient
      initialProjects={projects}
      initialCursor={nextCursor}
    />
  );
}
