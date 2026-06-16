import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api-error';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { projectService } from '@/services/project.service';
import { updateProjectSchema } from '@/schemas/project.schema';
import { getHealthBucket } from '@/lib/health-calculator';

// get project details
export const GET = asyncHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { id } = await context!.params;

    const project = await projectService.getByIdWithFullRelations(id);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const healthBucket = getHealthBucket(project.health);

    return apiResponse.success({ ...project, healthBucket });
  }
);

// update project
export const PATCH = asyncHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { id } = await context!.params;
    const user = await requireAuth();
    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    const updated = await projectService.update(id, user.id, validated);

    return apiResponse.success(updated);
  }
);
