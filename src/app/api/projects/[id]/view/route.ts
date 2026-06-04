import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';

export const POST = asyncHandler(async (
  req: NextRequest,
  context?: RouteContext
) => {
  const { id: projectId } = await context!.params;
  const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  // Check if a view exists for this IP in the last 12 hours
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const recentView = await prisma.projectView.findFirst({
    where: {
      projectId,
      ipAddress,
      createdAt: {
        gte: twelveHoursAgo,
      },
    },
  });

  if (recentView) {
    // Already viewed recently, don't increment view count
    return apiResponse.success({ viewed: false }, 'Already viewed recently');
  }

  // Transaction: Create view record and increment project view count
  await prisma.$transaction([
    prisma.projectView.create({
      data: {
        projectId,
        ipAddress,
      },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { viewCount: { increment: 1 } },
    }),
  ]);

  return apiResponse.created({ viewed: true }, 'View recorded');
});
