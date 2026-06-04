import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { projectService } from '@/services/project.service';
import { createProjectSchema } from '@/schemas/project.schema';
import type { ProjectState } from '@prisma/client';

/** List all projects, optionally filtered by state or userId. */
export const GET = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const state = searchParams.get('state') as ProjectState | null;
  const userId = searchParams.get('userId');

  const projects = await projectService.list({
    ...(state && { state }),
    ...(userId && { userId }),
  });

  return apiResponse.success(projects);
});

/** Create a new project. Requires authentication. */
export const POST = asyncHandler(async (request: NextRequest) => {
  const user = await requireAuth();
  const body = await request.json();
  const validated = createProjectSchema.parse(body);

  const project = await projectService.create(user.id, validated);

  return apiResponse.created(project, 'Project created');
});
