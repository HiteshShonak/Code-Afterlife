import { prisma } from '@/lib/prisma';
import type { Node, Edge } from '@xyflow/react';
import type { ProjectNodeData } from '@/components/lineage/ProjectNode';
import type { ProjectState } from '@prisma/client';

interface LineageProject {
  id: string;
  title: string;
  slug: string;
  state: ProjectState;
  health: number;
  lineageDepth: number;
  parentProjectId: string | null;
  user: { username: string | null } | null;
  resurrecter: { username: string | null } | null;
}

const INCLUDE = {
  user: { select: { username: true } },
  resurrecter: { select: { username: true } },
} as const;

export const lineageService = {
  // get lineage tree
  async getLineageTree(projectId: string): Promise<LineageProject[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: INCLUDE,
    });

    if (!project) return [];

    const all: LineageProject[] = [project];

    // go up
    let parentId = project.parentProjectId;
    while (parentId) {
      const ancestor = await prisma.project.findUnique({
        where: { id: parentId },
        include: INCLUDE,
      });
      if (!ancestor) break;
      all.unshift(ancestor);
      parentId = ancestor.parentProjectId;
    }

    // go down
    const queue = [projectId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await prisma.project.findMany({
        where: { parentProjectId: currentId },
        include: INCLUDE,
      });
      for (const child of children) {
        all.push(child);
        queue.push(child.id);
      }
    }

    return all;
  },

  // build flow graph
  buildReactFlowGraph(projects: LineageProject[]): {
    nodes: Node<ProjectNodeData>[];
    edges: Edge[];
  } {
    // group by depth
    const depthGroups = new Map<number, LineageProject[]>();
    for (const p of projects) {
      const group = depthGroups.get(p.lineageDepth) ?? [];
      group.push(p);
      depthGroups.set(p.lineageDepth, group);
    }

    const NODE_WIDTH = 250;
    const VERTICAL_GAP = 200;

    const nodes: Node<ProjectNodeData>[] = projects.map((project) => {
      const siblings = depthGroups.get(project.lineageDepth) ?? [project];
      const idx = siblings.indexOf(project);
      const totalWidth = siblings.length * NODE_WIDTH;
      const startX = -(totalWidth / 2);

      // node data
      const data: ProjectNodeData = {
        label:    project.title,
        state:    project.state,
        health:   project.health,
        username: project.user?.username ?? null,
        slug:     project.slug,
      };

      return {
        id:   project.id,
        type: 'projectNode',
        position: {
          x: startX + idx * NODE_WIDTH + NODE_WIDTH / 2,
          y: project.lineageDepth * VERTICAL_GAP,
        },
        data,
      };
    });

    const edges: Edge[] = projects
      .filter((p) => p.parentProjectId !== null)
      .map((project) => ({
        id:       `edge-${project.parentProjectId}-${project.id}`,
        source:   project.parentProjectId!,
        target:   project.id,
        label:    `Resurrected by ${project.resurrecter?.username ?? 'unknown'}`,
        animated: true,
      }));

    return { nodes, edges };
  },
};
