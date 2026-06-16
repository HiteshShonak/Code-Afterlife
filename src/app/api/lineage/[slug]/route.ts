import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api-error';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler, type RouteContext } from '@/lib/async-handler';
import { projectService } from '@/services/project.service';
import { lineageService } from '@/services/lineage.service';

// get lineage
export const GET = asyncHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { slug } = await context!.params;

    const project = await projectService.getBySlug(slug);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const lineageTree = await lineageService.getLineageTree(project.id);
    const graph = lineageService.buildReactFlowGraph(lineageTree);

    return apiResponse.success({ project, graph });
  }
);
