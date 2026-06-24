"use client";

import { useMemo, useEffect, useRef } from 'react';
import { ReactFlow, Node, Edge, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LifecycleNode } from './LifecycleNode';
import { LifecycleEdge } from './LifecycleEdge';
import { Handle, Position } from '@xyflow/react';

// ghost nodes
const GhostNode = () => (
  <div className="h-4 w-4 opacity-0">
    <Handle type="target" position={Position.Top} className="opacity-0!" />
    <Handle type="source" position={Position.Bottom} className="opacity-0!" />
  </div>
);

const nodeTypes = { cinematic: LifecycleNode, ghost: GhostNode };
const edgeTypes = { cinematic: LifecycleEdge };

const STAGES = ["Born", "Active", "Stalled", "Dead", "Flatline"];
const Y_SPACING = 250;
const NODE_WIDTH = 256;
const NODE_HEIGHT = 96;

function CameraFocus({ activeIndex }: { activeIndex: number }) {
  const { setCenter } = useReactFlow();
  const isInitialMount = useRef(true);

  useEffect(() => {
    const targetX = NODE_WIDTH / 2;
    const targetY = (activeIndex * Y_SPACING) + (NODE_HEIGHT / 2);
    
    // smooth snap
    const duration = isInitialMount.current ? 0 : 1200;
    setCenter(targetX, targetY, { zoom: 1.2, duration });
    
    isInitialMount.current = false;
  }, [activeIndex, setCenter]);

  return null;
}

export function ReactFlowLifecycle({ activeIndex }: { activeIndex: number }) {
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  const nodes: Node[] = useMemo(() => {
    const mainNodes: Node[] = STAGES.map((label, i) => ({
      id: `node-${i}`,
      type: 'cinematic',
      position: { x: 0, y: i * Y_SPACING },
      data: { 
        label, 
        isActive: i === activeIndex,
        isPast: i < activeIndex,
        stageIndex: i
      },
      draggable: false,
      selectable: false
    }));

    // ghost nodes
    mainNodes.unshift({
      id: 'node-entry',
      type: 'ghost',
      position: { x: (NODE_WIDTH / 2) - 8, y: -Y_SPACING * 1.5 },
      data: {},
      draggable: false,
      selectable: false
    });

    mainNodes.push({
      id: 'node-exit',
      type: 'ghost',
      position: { x: (NODE_WIDTH / 2) - 8, y: STAGES.length * Y_SPACING + (Y_SPACING * 0.5) },
      data: {},
      draggable: false,
      selectable: false
    });

    return mainNodes;
  }, [activeIndex]);

  const edges: Edge[] = useMemo(() => {
    const mainEdges = STAGES.slice(0, -1).map((_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'cinematic',
      data: {
        isActive: i === activeIndex - 1 || i === activeIndex,
        stageIndex: activeIndex
      },
      animated: false 
    }));

    // entry exit edges
    mainEdges.unshift({
      id: 'edge-entry',
      source: 'node-entry',
      target: 'node-0',
      type: 'cinematic',
      data: {
        isActive: activeIndex === 0,
        stageIndex: activeIndex
      },
      animated: false
    });

    mainEdges.push({
      id: 'edge-exit',
      source: `node-${STAGES.length - 1}`,
      target: 'node-exit',
      type: 'cinematic',
      data: {
        isActive: activeIndex === STAGES.length - 1,
        stageIndex: activeIndex
      },
      animated: false
    });

    return mainEdges;
  }, [activeIndex]);

  return (
    <div className="h-full w-full pointer-events-none select-none">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={memoizedNodeTypes}
          edgeTypes={memoizedEdgeTypes}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          elementsSelectable={false}
          nodesConnectable={false}
          nodesDraggable={false}
          proOptions={{ hideAttribution: true }}
        >
          <CameraFocus activeIndex={activeIndex} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
