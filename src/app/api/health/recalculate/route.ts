import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler } from '@/lib/async-handler';
import { healthService } from '@/services/health.service';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

/** Recalculate all project health scores. Protected by CRON_SECRET. */
export const POST = asyncHandler(async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedToken) {
    logger.warn('Unauthorized cron attempt on /api/health/recalculate');
    return apiResponse.error('Unauthorized', 401);
  }

  const result = await healthService.recalculateAll();

  logger.info('Health recalculation completed', result);

  return apiResponse.success(result, 'Health recalculation complete');
});
