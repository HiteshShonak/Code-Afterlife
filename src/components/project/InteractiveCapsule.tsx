'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  NodeTypes,
  NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { TimeCapsule } from '@prisma/client';
import { X, ExternalLink, Image as ImageIcon, Play, FileText, MessageSquare } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

const CINEMATIC_EASE = [0.16, 1, 0.3, 1] as const;
const COPPER = "#b87333";

// node components

function ArtifactBase({
  open,
  delay,
  label,
  children,
  accentColor = "rgba(251,191,36,0.22)",
  onClick,
}: {
  open: boolean;
  delay: number;
  label: string;
  children: React.ReactNode;
  accentColor?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.88, filter: "blur(8px)" }}
      animate={
        open
          ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
          : { opacity: 0, y: 18, scale: 0.88, filter: "blur(8px)" }
      }
      transition={{ duration: 1.3, delay: open ? delay : 0, ease: CINEMATIC_EASE }}
      onClick={onClick}
      className="nodrag-wrapper rounded-xl backdrop-blur-sm shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
      style={{
        border: `1px solid ${accentColor}`,
        background: "rgba(10,7,3,0.92)",
        boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px ${accentColor}`,
      }}
    >
      <div
        className="px-1.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.32em]"
        style={{ color: "rgba(251,191,36,0.5)", borderBottom: `1px solid ${accentColor}` }}
      >
        {label}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

function CapsuleNode({ data }: NodeProps) {
  const capsule = data.capsule as TimeCapsule;
  const onNodeClick = data.onNodeClick as (c: TimeCapsule) => void;

  return (
    <>
      <Handle type="source" position={Position.Bottom} className="opacity-0!" />
      <ArtifactBase 
        open={!!data.open} 
        delay={data.delay as number} 
        label={capsule.type}
        accentColor="rgba(251,191,36,0.25)"
        onClick={() => onNodeClick(capsule)}
      >
        <div className="w-[190px]">
          <h4 className="font-mono text-[11px] font-bold text-foreground/80 mb-1 truncate">{capsule.title}</h4>
          <p className="font-mono text-[9px] text-muted-foreground/60 mb-2">
            {formatRelativeDate(new Date(capsule.createdAt))}
          </p>
          
          {capsule.type === 'MESSAGE' && <MessageSquare className="h-6 w-6 text-amber-500/60 mt-2" />}
          {capsule.type === 'IMAGE' && <ImageIcon className="h-6 w-6 text-purple-400/60 mt-2" />}
          {capsule.type === 'VIDEO' && <Play className="h-6 w-6 text-red-400/60 mt-2" />}
          {capsule.type === 'AUDIO' && <Play className="h-6 w-6 text-sky-400/60 mt-2" />}
          {capsule.type === 'DOCUMENT' && <FileText className="h-6 w-6 text-gray-400/60 mt-2" />}
        </div>
      </ArtifactBase>
    </>
  );
}

const NODE_TYPES: NodeTypes = {
  capsuleNode: CapsuleNode,
};

// capsule svg

function CapsuleObject({
  lidRef,
  lockBodyRef,
  lockHaspRef,
  lockDotRef,
  lockSealedRef,
  lockOpenRef,
  warmHaloRef,
  onClick,
}: {
  lidRef: React.RefObject<SVGGElement | null>;
  lockBodyRef: React.RefObject<SVGRectElement | null>;
  lockHaspRef: React.RefObject<SVGPathElement | null>;
  lockDotRef: React.RefObject<SVGCircleElement | null>;
  lockSealedRef: React.RefObject<SVGTextElement | null>;
  lockOpenRef: React.RefObject<SVGTextElement | null>;
  warmHaloRef: React.RefObject<SVGRadialGradientElement | null>;
  onClick: () => void;
}) {
  return (
    <svg viewBox="0 0 280 420" className="w-full h-full cursor-pointer hover:scale-105 transition-transform duration-500" onClick={onClick} xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 48px rgba(184,115,51,0.22))", overflow: "visible" }}>
      <defs>
        <linearGradient id="tc-body" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1a1008" />
          <stop offset="25%"  stopColor="#2d1f0e" />
          <stop offset="50%"  stopColor="#3d2b14" />
          <stop offset="75%"  stopColor="#2d1f0e" />
          <stop offset="100%" stopColor="#1a1008" />
        </linearGradient>
        <linearGradient id="tc-lid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#2a1a0a" />
          <stop offset="45%"  stopColor="#4a2f14" />
          <stop offset="100%" stopColor="#1a1008" />
        </linearGradient>
        <linearGradient id="tc-seam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={COPPER} stopOpacity="0" />
          <stop offset="30%"  stopColor={COPPER} stopOpacity="0.75" />
          <stop offset="70%"  stopColor={COPPER} stopOpacity="0.75" />
          <stop offset="100%" stopColor={COPPER} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tc-inner-glow" cx="50%" cy="50%" r="55%" ref={warmHaloRef as any}>
          <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0" />
          <stop offset="60%"  stopColor="#92400e" stopOpacity="0" />
          <stop offset="100%" stopColor="#451a03" stopOpacity="0" />
        </radialGradient>
        <clipPath id="tc-body-clip">
          <rect x="30" y="132" width="220" height="270" rx="8" />
        </clipPath>
      </defs>

      <rect x="30" y="132" width="220" height="270" rx="8" fill="url(#tc-body)" />
      <rect x="30" y="132" width="220" height="270" rx="8" fill="url(#tc-inner-glow)" clipPath="url(#tc-body-clip)" />
      
      {[175, 220, 265, 310, 355].map((y) => (
        <rect key={y} x="30" y={y} width="220" height="1.5" rx="0.75" fill={COPPER} opacity="0.1" />
      ))}
      <line x1="37" y1="137" x2="37" y2="396" stroke="#0a0603" strokeWidth="2" opacity="0.7" />
      <line x1="243" y1="137" x2="243" y2="396" stroke="#0a0603" strokeWidth="2" opacity="0.7" />
      
      <rect x="75" y="200" width="130" height="44" rx="3" fill="#0f0905" stroke={COPPER} strokeWidth="0.5" strokeOpacity="0.32" />
      <text x="140" y="217" textAnchor="middle" fontSize="5.5" fill={COPPER} fillOpacity="0.65" fontFamily="monospace" letterSpacing="3">CODE · AFTERLIFE</text>
      <text x="140" y="228" textAnchor="middle" fontSize="4" fill={COPPER} fillOpacity="0.4" fontFamily="monospace" letterSpacing="2">ARCHIVE UNIT</text>
      <text x="140" y="237" textAnchor="middle" fontSize="3.5" fill={COPPER} fillOpacity="0.3" fontFamily="monospace" letterSpacing="1.5">PRESERVED · SEALED</text>
      
      {[88, 102].map((cx, i) => (
        <g key={cx}>
          <circle cx={cx} cy="358" r="3" fill="#100804" stroke={COPPER} strokeWidth="0.4" strokeOpacity="0.4" />
          <circle cx={cx} cy="358" r="1.4" fill={i === 0 ? "#ef4444" : "#fbbf24"} opacity="0.55">
            <animate attributeName="opacity" values="0.55;0.12;0.55" dur={i === 0 ? "2.2s" : "3.3s"} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      
      <rect x="22" y="395" width="236" height="11" rx="3.5" fill="#180e06" stroke={COPPER} strokeWidth="0.4" strokeOpacity="0.28" />
      
      {[{ x: 23 }, { x: 247 }].map(({ x }, i) => (
        <g key={i}>
          <rect x={x} y="148" width="10" height="22" rx="2" fill="#140d06" stroke={COPPER} strokeWidth="0.4" strokeOpacity="0.45" />
          <circle cx={x + 5} cy="159" r="2.2" fill={COPPER} fillOpacity="0.35" />
        </g>
      ))}
      
      <line x1="30" y1="133" x2="250" y2="133" stroke="url(#tc-seam)" strokeWidth="1.5" />

      {/* lid */}
      <g ref={lidRef as any} style={{ transformOrigin: "140px 132px" }}>
        <rect x="30" y="30" width="220" height="104" rx="8" fill="url(#tc-lid)" />
        {[54, 76, 98].map((y) => (
          <rect key={y} x="30" y={y} width="220" height="1.5" rx="0.75" fill={COPPER} opacity="0.09" />
        ))}
        <line x1="37" y1="36" x2="37" y2="130" stroke="#0a0603" strokeWidth="2" opacity="0.7" />
        <line x1="243" y1="36" x2="243" y2="130" stroke="#0a0603" strokeWidth="2" opacity="0.7" />
        <rect x="108" y="36" width="64" height="7" rx="3.5" fill="#160e06" stroke={COPPER} strokeWidth="0.5" strokeOpacity="0.42" />
        <rect x="120" y="38" width="40" height="3" rx="1.5" fill={COPPER} fillOpacity="0.18" />

        <rect className="tc-lock-panel" x="113" y="88" width="54" height="30" rx="3" fill="#0d0804" stroke={COPPER} strokeWidth="0.4" strokeOpacity="0.35" />

        <rect ref={lockBodyRef as any} x="132" y="100" width="16" height="11" rx="1.8" fill="none" stroke="#ef4444" strokeWidth="1.1" strokeOpacity="0.85" />
        <path ref={lockHaspRef as any} d="M134.5 100 Q134.5 95.5 140 95.5 Q145.5 95.5 145.5 100" fill="none" stroke="#ef4444" strokeWidth="1.1" strokeLinecap="round" />
        <circle ref={lockDotRef as any} cx="140" cy="106" r="1.8" fill="#ef4444" fillOpacity="0.75" />

        <text ref={lockSealedRef as any} x="140" y="122" textAnchor="middle" fontSize="4" fill="#ef4444" fillOpacity="0.55" fontFamily="monospace" letterSpacing="2">SEALED</text>
        <text ref={lockOpenRef as any} x="140" y="122" textAnchor="middle" fontSize="4" fill="#22c55e" fillOpacity="0" fontFamily="monospace" letterSpacing="2">OPEN</text>

        <ellipse cx="140" cy="38" rx="78" ry="5.5" fill="white" fillOpacity="0.025" />
        <line x1="30" y1="132" x2="250" y2="132" stroke="url(#tc-seam)" strokeWidth="1" />
      </g>
    </svg>
  );
}

// main component

export function InteractiveCapsule({ capsules, isDead }: { capsules: TimeCapsule[], isDead: boolean }) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const lidRef        = useRef<SVGGElement>(null);
  const warmHaloRef   = useRef<SVGRadialGradientElement>(null);
  const lockBodyRef   = useRef<SVGRectElement>(null);
  const lockHaspRef   = useRef<SVGPathElement>(null);
  const lockDotRef    = useRef<SVGCircleElement>(null);
  const lockSealedRef = useRef<SVGTextElement>(null);
  const lockOpenRef   = useRef<SVGTextElement>(null);
  const warmGlowDiv   = useRef<HTMLDivElement>(null);
  const warmHaloDiv   = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null);

  const initialNodes = useMemo(() => {
    return capsules.map((capsule, i) => {
      // position radially
      const angle = (i / capsules.length) * Math.PI * 2;
      const radius = 250;
      return {
        id: capsule.id,
        type: 'capsuleNode',
        position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius - 100 },
        data: {
          open: false,
          delay: i * 0.1,
          capsule,
          onNodeClick: (c: TimeCapsule) => setSelectedCapsule(c),
        },
        draggable: true,
        selectable: false,
      };
    });
  }, [capsules]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const memoizedNodeTypes = useMemo(() => NODE_TYPES, []);

  // sync state
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, open: isOpen },
        draggable: isOpen,
      }))
    );
  }, [isOpen, setNodes]);

  const handleToggleOpen = () => {
    if (!isDead && capsules.length > 0) return;
    
    const newOpen = !isOpen;
    setIsOpen(newOpen);

    const tl = gsap.timeline();

    if (newOpen) {
      tl.to(lockBodyRef.current, { stroke: "#22c55e", strokeOpacity: 0.9, duration: 0.25 }, 0)
        .to(lockHaspRef.current, { stroke: "#22c55e", y: -8, duration: 0.35, ease: "power2.out" }, 0)
        .to(lockDotRef.current, { fill: "#22c55e", duration: 0.25 }, 0)
        .to(lockSealedRef.current, { fillOpacity: 0, duration: 0.2 }, 0.05)
        .to(lockOpenRef.current, { fillOpacity: 0.75, duration: 0.2 }, 0.15)
        .to(lidRef.current, { rotationX: -115, ease: "power3.inOut", duration: 0.75 }, 0.22)
        .to(warmGlowDiv.current, { opacity: 1, ease: "power2.out", duration: 0.5 }, 0.5)
        .to(warmHaloDiv.current, { opacity: 0.85, scale: 1.18, ease: "power2.out", duration: 0.6 }, 0.45);
    } else {
      tl.to(lidRef.current, { rotationX: 0, ease: "power3.inOut", duration: 0.75 }, 0)
        .to(warmGlowDiv.current, { opacity: 0, ease: "power2.in", duration: 0.5 }, 0)
        .to(warmHaloDiv.current, { opacity: 0, scale: 1, ease: "power2.in", duration: 0.6 }, 0)
        .to(lockHaspRef.current, { stroke: "#ef4444", y: 0, duration: 0.35, ease: "power2.in" }, 0.4)
        .to(lockBodyRef.current, { stroke: "#ef4444", strokeOpacity: 0.85, duration: 0.25 }, 0.5)
        .to(lockDotRef.current, { fill: "#ef4444", duration: 0.25 }, 0.5)
        .to(lockOpenRef.current, { fillOpacity: 0, duration: 0.2 }, 0.5)
        .to(lockSealedRef.current, { fillOpacity: 0.55, duration: 0.2 }, 0.6);
    }
  };

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-[#0a0705]">
      
      {/* background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* warm halo */}
      <div ref={warmHaloDiv}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full opacity-0"
        style={{ background: "radial-gradient(ellipse at center,rgba(251,191,36,0.18) 0%,rgba(180,100,20,0.07) 55%,transparent 78%)" }}
      />

      {/* internal warmth */}
      <div ref={warmGlowDiv}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[-42%] w-[190px] h-[220px] opacity-0 rounded-b-xl z-20"
        style={{ background: "radial-gradient(ellipse at top,rgba(251,191,36,0.30) 0%,rgba(180,100,20,0.12) 60%,transparent 100%)" }}
      />

      {/* capsule svg */}
      <div className="relative z-30 flex items-center justify-center pointer-events-auto" style={{ perspective: "900px", perspectiveOrigin: "center 40%" }}>
        <div className="w-[180px] aspect-280/420">
          <CapsuleObject
            lidRef={lidRef}
            lockBodyRef={lockBodyRef}
            lockHaspRef={lockHaspRef}
            lockDotRef={lockDotRef}
            lockSealedRef={lockSealedRef}
            lockOpenRef={lockOpenRef}
            warmHaloRef={warmHaloRef}
            onClick={handleToggleOpen}
          />
        </div>
      </div>

      {/* instructions */}
      {!isOpen && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 z-40 pointer-events-none">
          {isDead ? "Click the lock to unseal the archive" : "Archive remains sealed while project lives"}
        </div>
      )}

      {/* canvas */}
      <div className="absolute inset-0 z-10" style={{ pointerEvents: isOpen ? 'auto' : 'none' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={[]}
            nodeTypes={memoizedNodeTypes}
            onNodesChange={onNodesChange}
            panOnDrag={true}
            panOnScroll={true}
            zoomOnScroll={true}
            nodesDraggable={isOpen}
            elementsSelectable={false}
            nodesConnectable={false}
            style={{ background: 'transparent' }}
            proOptions={{ hideAttribution: true }}
            fitView
          />
        </ReactFlowProvider>
      </div>

      {/* detail modal */}
      <AnimatePresence>
        {selectedCapsule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setSelectedCapsule(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-[#0a0705] border border-amber-500/30 rounded-2xl p-8 shadow-2xl"
            >
              <button 
                onClick={() => setSelectedCapsule(null)}
                className="absolute top-4 right-4 p-2 text-muted-foreground/60 hover:text-foreground bg-background/50 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
                  {selectedCapsule.type === 'MESSAGE' && <MessageSquare className="h-6 w-6" />}
                  {selectedCapsule.type === 'IMAGE' && <ImageIcon className="h-6 w-6" />}
                  {selectedCapsule.type === 'VIDEO' && <Play className="h-6 w-6" />}
                  {selectedCapsule.type === 'AUDIO' && <Play className="h-6 w-6" />}
                  {selectedCapsule.type === 'DOCUMENT' && <FileText className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-mono text-xl font-bold text-amber-50">{selectedCapsule.title}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-amber-500/50">
                    {formatRelativeDate(new Date(selectedCapsule.createdAt))}
                  </p>
                </div>
              </div>

              {selectedCapsule.mediaUrl && (
                <div className="mb-6 rounded-xl overflow-hidden border border-border/50">
                  {selectedCapsule.type === 'IMAGE' ? (
                    <img src={selectedCapsule.mediaUrl} alt={selectedCapsule.title} className="w-full h-auto object-contain max-h-[400px]" />
                  ) : selectedCapsule.type === 'VIDEO' ? (
                    <video src={selectedCapsule.mediaUrl} controls className="w-full" />
                  ) : selectedCapsule.type === 'AUDIO' ? (
                    <audio src={selectedCapsule.mediaUrl} controls className="w-full mt-4" />
                  ) : (
                    <a href={selectedCapsule.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center p-8 bg-card/50 text-accent hover:underline gap-2 font-mono text-sm">
                      <ExternalLink className="h-4 w-4" /> Download Attachment
                    </a>
                  )}
                </div>
              )}

              {selectedCapsule.content && (
                <div className="prose prose-invert max-w-none">
                  <p className="font-sans text-[15px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {selectedCapsule.content}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
