import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler } from '@/lib/async-handler';
import { healthService } from '@/services/health.service';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

async function recalculateHealth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedToken) {
    logger.warn('Unauthorized cron attempt on /api/health/recalculate');
    return apiResponse.error('Unauthorized', 401);
  }

  if (!process.env.GITHUB_TOKEN) {
    logger.warn('[Health Recalculate] GITHUB_TOKEN is not set. GitHub commit fetches will use unauthenticated rate limits. Health scores may be inaccurate for projects with many repos.');
  }

  const result = await healthService.recalculateAll();

  logger.info('Health recalculation completed', result);

  return apiResponse.success(result, 'Health recalculation complete');
}

export const GET = asyncHandler(recalculateHealth);

export const POST = asyncHandler(recalculateHealth);
