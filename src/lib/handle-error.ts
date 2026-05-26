import { NextResponse } from 'next/server';
import { ApiError } from './api-error';
import { apiResponse } from './api-response';
import { logger } from './logger';
import { isZodError, extractZodErrors } from './zod-errors';

/**
 * Prisma error shape — duck-typed to avoid importing @prisma/client here.
 */
interface PrismaKnownError extends Error {
  code: string;
  meta?: { target?: string[] };
}

/**
 * Check if an error is a Prisma known request error by duck-typing.
 */
function isPrismaError(error: unknown): error is PrismaKnownError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Map any caught error to a standardized NextResponse.
 *
 * Priority order:
 * 1. ApiError → direct status code mapping
 * 2. ZodError → 400 with field-level errors
 * 3. PrismaClientKnownRequestError → mapped DB errors
 * 4. Unknown → 500 with generic message (details logged server-side)
 */
export function handleError(error: unknown): NextResponse {
  // Known domain errors
  if (error instanceof ApiError) {
    return apiResponse.error(error.message, error.statusCode, error.errors);
  }

  // Zod validation errors
  if (isZodError(error)) {
    const fieldErrors = extractZodErrors(error.issues);
    return apiResponse.error('Validation failed', 400, fieldErrors);
  }

  // Prisma known request errors
  if (isPrismaError(error)) {
    switch (error.code) {
      case 'P2002': {
        const target = error.meta?.target?.join(', ') || 'field';
        return apiResponse.error(
          `A record with this ${target} already exists`,
          409
        );
      }
      case 'P2025':
        return apiResponse.error('Record not found', 404);
      default:
        return apiResponse.error('Database error', 400);
    }
  }

  // Unknown errors — log and return generic 500
  logger.error('Unhandled error', error);
  return apiResponse.error('Internal server error', 500);
}
