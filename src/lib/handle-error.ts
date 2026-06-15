import { NextResponse } from 'next/server';
import { ApiError } from './api-error';
import { apiResponse } from './api-response';
import { logger } from './logger';
import { isZodError, extractZodErrors } from './zod-errors';

// prisma error shape
interface PrismaKnownError extends Error {
  code: string;
  meta?: { target?: string[] };
}

// check for prisma error
function isPrismaError(error: unknown): error is PrismaKnownError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

// map error to response
export function handleError(error: unknown): NextResponse {
  // known domain errors
  if (error instanceof ApiError) {
    return apiResponse.error(error.message, error.statusCode, error.errors);
  }

  // zod validation errors
  if (isZodError(error)) {
    const fieldErrors = extractZodErrors(error.issues);
    return apiResponse.error('Validation failed', 400, fieldErrors);
  }

  // prisma request errors
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

  // log unknown errors
  logger.error('Unhandled error', error);
  return apiResponse.error('Internal server error', 500);
}
