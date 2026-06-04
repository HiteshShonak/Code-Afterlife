import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api-error';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { projectService } from '@/services/project.service';
import { updateStateSchema } from '@/schemas/project.schema';
import type { ProjectState } from '@prisma/client';

/** Transition a project to a new lifecycle state. Validates ownership and state machine rules. */
export const PATCH = asyncHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { id } = await context!.params;
    const user = await requireAuth();
    const body = await request.json();
    const validated = updateStateSchema.parse(body);
    const newState = validated.state as ProjectState;

    // Verify the authenticated user owns this project before mutating its state
    const existing = await projectService.getById(id);
    if (!existing) throw ApiError.notFound('Project not found');
    if (existing.userId !== user.id) throw ApiError.forbidden('You do not own this project');

    const updated = await projectService.updateState(id, newState);

    return apiResponse.success(updated, `State changed to ${newState}`);
  }
);
