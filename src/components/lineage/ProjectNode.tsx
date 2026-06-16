'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { StateBadge } from '@/components/StateBadge';
import type { ProjectState } from '@prisma/client';

// project node data
export interface ProjectNodeData extends Record<string, unknown> {
  label: string;          // title
  state: ProjectState;
  health: number;
  username: string | null;
  slug: string;
}

interface ProjectNodeProps {
  data: ProjectNodeData;
}

// custom project node
export const ProjectNode = memo(function ProjectNode({ data }: ProjectNodeProps) {
  const { label, state, username } = data;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!border-foreground/20 !bg-background"
      />

      <div className="min-w-[160px] rounded-sm border border-foreground/16 bg-card/95 p-3 shadow-lg backdrop-blur-sm">
        <div className="mb-2">
          <StateBadge state={state} />
        </div>

        <p className="font-mono text-[11px] font-semibold leading-tight text-foreground">
          {label}
        </p>

        {username && (
          <p className="mt-1 font-mono text-[9px] text-muted-foreground/60">
            @{username}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!border-foreground/20 !bg-background"
      />
    </>
  );
});
