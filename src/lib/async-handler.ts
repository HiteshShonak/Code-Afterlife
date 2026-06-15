import { NextRequest, NextResponse } from 'next/server';
import { handleError } from './handle-error';
import { ApiError } from './api-error';
import { logger } from './logger';
import { isZodError, extractZodErrors } from './zod-errors';

// next 16 route context
export interface RouteContext<TParams = Record<string, string>> {
  params: Promise<TParams>;
}

// route handler
type RouteHandlerFn = (
  request: NextRequest,
  context?: RouteContext
) => Promise<NextResponse | Response>;

// try-catch wrapper for routes
export function asyncHandler(handler: RouteHandlerFn): RouteHandlerFn {
  return async (
    request: NextRequest,
    context?: RouteContext
  ): Promise<NextResponse | Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

// success result
export interface ActionSuccess<T> {
  readonly success: true;
  readonly data: T;
  readonly message?: string;
}

// fail result
export interface ActionError {
  readonly success: false;
  readonly message: string;
  readonly errors?: Record<string, string[]>;
}

// result union
export type ActionResult<T> = ActionSuccess<T> | ActionError;

// error handler for actions
export function actionHandler<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    try {
      const result = await action(...args);
      return { success: true, data: result };
    } catch (error) {
      // known domain error
      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
          ...(error.errors && { errors: error.errors }),
        };
      }

      // validation failure
      if (isZodError(error)) {
        const fieldErrors = extractZodErrors(error.issues);
        return {
          success: false,
          message: 'Validation failed',
          errors: fieldErrors,
        };
      }

      // generic error
      logger.error('Unhandled action error', error);
      return { success: false, message: 'Something went wrong' };
    }
  };
}
