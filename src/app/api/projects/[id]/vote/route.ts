import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { socialService } from '@/services/social.service';
import { z } from 'zod';
import type { VoteType } from '@prisma/client';

const voteSchema = z.object({
  vote: z.enum(['WILL_SHIP', 'WILL_DIE']),
});

/**
 * POST /api/projects/[id]/vote
 * Cast or toggle a vote (WILL_SHIP | WILL_DIE).
 * - Same vote again → removes it
 * - Different vote → changes to new type
 */
export const POST = asyncHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const user = await requireAuth();
  const { id: projectId } = await ctx!.params;
  const body = await req.json();
  const { vote } = voteSchema.parse(body);

  const result = await socialService.castVote(projectId, user.id, vote as VoteType);
  return apiResponse.success(result, 'Vote recorded');
});

/**
 * GET /api/projects/[id]/vote
 * Returns vote stats + user's current vote (or null if unauth).
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

  const stats = await socialService.getVoteStats(projectId, userId);
  return apiResponse.success(stats);
});
