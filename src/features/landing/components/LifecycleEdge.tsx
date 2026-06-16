import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

const STAGE_COLORS = {
  0: { stroke: "rgba(255, 255, 255, 0.6)", orb: "rgba(255, 255, 255, 1)" },
  1: { stroke: "rgba(139, 92, 246, 0.6)", orb: "rgba(139, 92, 246, 1)" },
  2: { stroke: "rgba(245, 158, 11, 0.6)", orb: "rgba(245, 158, 11, 1)" },
  3: { stroke: "rgba(239, 68, 68, 0.3)", orb: "rgba(239, 68, 68, 0.5)" }, // Faded red for dead
  4: { stroke: "rgba(217, 70, 239, 0.6)", orb: "rgba(217, 70, 239, 1)" },
};

export function LifecycleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  const isActive = data?.isActive;
  const stageIndex = (data?.stageIndex as keyof typeof STAGE_COLORS) ?? 0;
  
  // The edge color inherits the current globally active stage color
  const config = STAGE_COLORS[stageIndex];

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
            ...style, 
            stroke: isActive ? config.stroke : 'rgba(255,255,255,0.05)', 
            strokeWidth: isActive ? 2 : 1,
            transition: 'stroke 1.5s ease, stroke-width 1s ease'
        }} 
      />
      
      {/* light orb */}
      {isActive && stageIndex !== 3 && ( // No orb travels during stage 3 (Dead)
        <circle r="4" fill={config.orb} filter={`drop-shadow(0 0 6px ${config.orb})`}>
          <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}
