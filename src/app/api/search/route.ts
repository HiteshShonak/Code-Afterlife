import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler } from '@/lib/async-handler';
import { getSearchPage } from '@/services/search.service';
import { getDiscoveryFeed } from '@/services/discovery.service';
import type { ProjectState } from '@prisma/client';

export const GET = asyncHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') || undefined;
  const sort = (searchParams.get('sort') as any) || 'TRENDING';
  const state = (searchParams.get('state') as ProjectState) || undefined;
  
  if (sort === 'DISCOVERY') {
    const discoveryFeed = await getDiscoveryFeed(cursor);
    return apiResponse.success(discoveryFeed);
  }
  
  const searchPage = await getSearchPage({
    cursor,
    sort,
    state,
  });

  return apiResponse.success(searchPage);
});
