import { apiResponse } from '@/lib/api-response';
import { asyncHandler } from '@/lib/async-handler';
import { projectService } from '@/services/project.service';

/** List all dead projects. Public endpoint — no auth required. */
export const GET = asyncHandler(async () => {
  const projects = await projectService.getDeadProjects();
  return apiResponse.success(projects);
});
