import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api-error';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { socialService } from '@/services/social.service';

// toggle like
export const POST = asyncHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  const user = await requireAuth();
  const { id: projectId } = await ctx!.params;

  const result = await socialService.toggleLike(projectId, user.id);
  return apiResponse.success(result, result.liked ? 'Liked' : 'Unliked');
});

// get like status
export const GET = asyncHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  const { id: projectId } = await ctx!.params;

  // Try to get session — optional auth
  let userId: string | undefined;
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    userId = session?.user?.id;
  } catch {
    userId = undefined;
  }

  if (!userId) {
    return apiResponse.success({ liked: false });
  }

  const liked = await socialService.hasLiked(projectId, userId);
  return apiResponse.success({ liked });
});
