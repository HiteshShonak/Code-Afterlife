'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { ProjectNodeData } from './ProjectNode';

/**
 * Dynamic import — @xyflow/react is a heavy bundle (~500KB).
 * Must be SSR=false because it uses browser-only APIs.
 */
const ReactFlowGraph = dynamic(() => import('./ReactFlowGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-card/40">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
        Loading lineage graph…
      </p>
    </div>
  ),
});

interface LineageGraphProps {
  nodes: Node<ProjectNodeData>[];
  edges: Edge[];
}

/**
 * Public API for the lineage graph.
 * Handles the SSR dynamic-import boundary.
 * Server pages pass pre-fetched nodes/edges here.
 * Memoizes props to prevent unnecessary ReactFlow re-renders.
 */
export function LineageGraph({ nodes, edges }: LineageGraphProps) {
  const stableNodes = useMemo(() => nodes, [nodes]);
  const stableEdges = useMemo(() => edges, [edges]);

  return <ReactFlowGraph nodes={stableNodes} edges={stableEdges} />;
}
