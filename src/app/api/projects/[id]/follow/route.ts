import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { socialService } from '@/services/social.service';

/**
 * POST /api/projects/[id]/follow
 * Toggle following a project. Auth required.
 * Returns: { following: boolean }
 */
export const POST = asyncHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  const user = await requireAuth();
  const { id: projectId } = await ctx!.params;

  const result = await socialService.toggleProjectFollow(projectId, user.id);
  return apiResponse.success(result, result.following ? 'Following project' : 'Unfollowed project');
});

/**
 * GET /api/projects/[id]/follow
 * Returns whether the current user follows this project.
 */
export const GET = asyncHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  const { id: projectId } = await ctx!.params;

  let userId: string | undefined;
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    userId = session?.user?.id;
  } catch {
    userId = undefined;
  }

  if (!userId) {
    return apiResponse.success({ following: false });
  }

  const following = await socialService.isFollowingProject(projectId, userId);
  return apiResponse.success({ following });
});
