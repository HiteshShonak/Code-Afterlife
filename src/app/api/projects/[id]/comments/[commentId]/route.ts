import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api-error';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { socialService } from '@/services/social.service';

/**
 * DELETE /api/projects/[id]/comments/[commentId]
 * Delete a comment. Only the comment author can delete their own comment.
 */
export const DELETE = asyncHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  const user = await requireAuth();
  const { commentId } = await ctx!.params;

  try {
    await socialService.deleteComment(commentId, user.id);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Forbidden') throw ApiError.forbidden('You can only delete your own comments');
      if (err.message === 'Comment not found') throw ApiError.notFound('Comment not found');
    }
    throw err;
  }

  return apiResponse.success(null, 'Comment deleted');
});
