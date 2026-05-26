import { NextRequest, NextResponse } from 'next/server';
import { handleError } from './handle-error';
import { ApiError } from './api-error';
import { logger } from './logger';
import { isZodError, extractZodErrors } from './zod-errors';

/**
 * Next.js 16 route context — params are always a Promise.
 * Use this for dynamic routes like /api/projects/[id].
 */
export interface RouteContext<TParams = Record<string, string>> {
  params: Promise<TParams>;
}

/**
 * Route handler function with optional typed context.
 * Compatible with Next.js 16's GET/POST/PATCH/DELETE exports.
 */
type RouteHandlerFn = (
  request: NextRequest,
  context?: RouteContext
) => Promise<NextResponse | Response>;

/**
 * Wraps a Next.js route handler with centralized try/catch.
 * All errors are caught by `handleError()` and mapped to standardized responses.
 *
 * @example
 * ```ts
 * export const GET = asyncHandler(async (request, context) => {
 *   const { id } = await context!.params;
 *   const project = await projectService.getById(id);
 *   return apiResponse.success(project);
 * });
 * ```
 */
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

/** Successful server action result. */
export interface ActionSuccess<T> {
  readonly success: true;
  readonly data: T;
  readonly message?: string;
}

/** Failed server action result. */
export interface ActionError {
  readonly success: false;
  readonly message: string;
  readonly errors?: Record<string, string[]>;
}

/** Discriminated union of success/error for server actions. */
export type ActionResult<T> = ActionSuccess<T> | ActionError;

/**
 * Wraps a server action with centralized error handling.
 * Returns plain objects (NOT NextResponse) for client-side consumption.
 *
 * @example
 * ```ts
 * export const createProject = actionHandler(async (formData: FormData) => {
 *   const user = await requireAuth();
 *   const validated = createProjectSchema.parse({ ... });
 *   return projectService.create(user.id, validated);
 * });
 * ```
 */
export function actionHandler<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    try {
      const result = await action(...args);
      return { success: true, data: result };
    } catch (error) {
      // ApiError → known domain error
      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
          ...(error.errors && { errors: error.errors }),
        };
      }

      // ZodError → validation failure
      if (isZodError(error)) {
        const fieldErrors = extractZodErrors(error.issues);
        return {
          success: false,
          message: 'Validation failed',
          errors: fieldErrors,
        };
      }

      // Unknown → generic error (details logged server-side)
      logger.error('Unhandled action error', error);
      return { success: false, message: 'Something went wrong' };
    }
  };
}
