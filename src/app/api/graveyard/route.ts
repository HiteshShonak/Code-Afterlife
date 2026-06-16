import { apiResponse } from '@/lib/api-response';
import { asyncHandler } from '@/lib/async-handler';
import { projectService } from '@/services/project.service';

// get dead projects
export const GET = asyncHandler(async () => {
  const projects = await projectService.getDeadProjects();
  return apiResponse.success(projects);
});
