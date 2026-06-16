import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { resurrectionService } from '@/services/resurrection.service';
import { resurrectProjectSchema } from '@/schemas/project.schema';

// resurrect project
export const POST = asyncHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { id } = await context!.params;
    const user = await requireAuth();
    const body = await request.json();
    const validated = resurrectProjectSchema.parse(body);

    const newProject = await resurrectionService.resurrect(
      id,
      user.id,
      validated
    );

    return apiResponse.created(newProject, 'Project resurrected');
  }
);
