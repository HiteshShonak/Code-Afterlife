'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ProjectNode, type ProjectNodeData } from './ProjectNode';

const NODE_TYPES = { projectNode: ProjectNode } as const;

const STATE_COLORS: Record<string, string> = {
  BORN:    '#38bdf8',
  ACTIVE:  '#4ade80',
  STALLED: '#fbbf24',
  SHIPPED: '#a78bfa',
  DEAD:    '#6b7280',
};

interface ReactFlowGraphProps {
  nodes: Node<ProjectNodeData>[];
  edges: Edge[];
}

/**
 * Actual React Flow renderer — SSR-disabled via dynamic import in LineageGraph.tsx.
 * Uses ProjectNode as the custom node type for project cards.
 * Read-only: no node dragging/editing — lineage is a fixed hierarchy.
 */
export default function ReactFlowGraph({ nodes: initialNodes, edges: initialEdges }: ReactFlowGraphProps) {
  const [nodes, , onNodesChange] = useNodesState<Node<ProjectNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={NODE_TYPES}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.3}
      maxZoom={2}
      style={{ background: 'transparent' }}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        animated: true,
        style: { stroke: 'oklch(0.66 0.19 295 / 0.6)', strokeWidth: 1.5 },
      }}
    >
      <Background color="oklch(1 0 0 / 4%)" gap={20} size={1} />
    </ReactFlow>
  );
}
