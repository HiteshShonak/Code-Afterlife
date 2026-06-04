import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { socialService } from '@/services/social.service';
import { createCommentSchema } from '@/schemas/comment.schema';

/**
 * GET /api/projects/[id]/comments
 * List comments, newest first, cursor-paginated.
 * Query: ?cursor=<commentId>
 */
export const GET = asyncHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const { id: projectId } = await ctx!.params;
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;

  const result = await socialService.getComments(projectId, cursor);
  return apiResponse.success(result);
});

/**
 * POST /api/projects/[id]/comments
 * Create a comment. Requires auth.
 * Body: { content: string }
 */
export const POST = asyncHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const user = await requireAuth();
  const { id: projectId } = await ctx!.params;
  const body = await req.json();
  const validated = createCommentSchema.parse(body);

  const comment = await socialService.createComment(projectId, user.id, validated.content);
  return apiResponse.success(comment, 'Comment posted');
});
