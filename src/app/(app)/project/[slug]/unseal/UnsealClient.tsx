"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CINEMATIC_EASE } from "@/lib/utils/animation";
import { Project, TimeCapsule } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { LockOpen, Play, FileText, Image as ImageIcon, MessageSquare, X, ExternalLink } from "lucide-react";
import Link from "next/link";

const COPPER = "#b87333";

function getCapsulePresentation(capsule: TimeCapsule) {
  if (capsule.type === "AUDIO") {
    return {
      accentColor: "rgba(56,189,248,0.25)",
      Icon: Play,
      iconClassName: "text-sky-400/80",
    };
  }

  if (capsule.type === "IMAGE") {
    return {
      accentColor: "rgba(167,139,250,0.25)",
      Icon: ImageIcon,
      iconClassName: "text-violet-300/80",
    };
  }

  if (capsule.type === "VIDEO") {
    return {
      accentColor: "rgba(248,113,113,0.25)",
      Icon: Play,
      iconClassName: "text-red-300/80",
    };
  }

  if (capsule.type === "DOCUMENT") {
    return {
      accentColor: "rgba(156,163,175,0.25)",
      Icon: FileText,
      iconClassName: "text-slate-300/80",
    };
  }

  return {
    accentColor: "rgba(251,191,36,0.25)",
    Icon: MessageSquare,
    iconClassName: "text-amber-300/80",
  };
}

// ─── ARTIFACT CARD BASE ───────────────────────────────────────────────────────
function ArtifactBase({
  open,
  delay,
  label,
  children,
  accentColor = "rgba(251,191,36,0.22)",
  onClick,
  className = "",
}: {
  open: boolean;
  delay: number;
  label: string;
  children: React.ReactNode;
  accentColor?: string;
  onClick?: () => void;
  className?: string;
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
      className={`nodrag-wrapper rounded-xl backdrop-blur-sm shadow-2xl overflow-hidden ${className}`}
      style={{
        border: `1px solid ${accentColor}`,
        background: "rgba(10,7,3,0.92)",
        boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px ${accentColor}`,
      }}
    >
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em]"
        style={{ color: "rgba(251,191,36,0.5)", borderBottom: `1px solid ${accentColor}` }}
      >
        {label}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

// ─── NODE TYPES ─────────────────────────────────────────────────────────────
function CapsuleNode({ data }: NodeProps) {
  const capsule = data.capsule as TimeCapsule;
  const onNodeClick = data.onNodeClick as (capsule: TimeCapsule) => void;
  const { accentColor, Icon, iconClassName } = getCapsulePresentation(capsule);

  return (
    <>
      <Handle type="source" position={Position.Bottom} className="opacity-0!" />
      <ArtifactBase 
        open={!!data.open} 
        delay={data.delay as number} 
        label={capsule.type}
        accentColor={accentColor}
        onClick={() => onNodeClick(capsule)}
        className="cursor-pointer transition-transform hover:scale-[1.03]"
      >
        <div className="w-55 flex flex-col gap-3 group relative cursor-pointer">
          <div className="font-mono text-[12px] text-foreground/84 font-bold uppercase tracking-[0.12em]">
            {capsule.title}
          </div>

          <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/52">
            <Icon className={`size-4 ${iconClassName}`} />
            <span>Stored Artifact</span>
          </div>
          
          {capsule.type === "IMAGE" && capsule.mediaUrl && (
            <div className="w-full aspect-video rounded overflow-hidden bg-black/40 border border-white/5 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capsule.mediaUrl} alt={capsule.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          {capsule.type === "AUDIO" && (
            <div className="flex items-center gap-1.5 h-6 opacity-60">
               {Array.from({length: 15}).map((_, i) => (
                 <div key={i} className="w-1 rounded-full bg-sky-400/80" style={{ height: `${Math.random() * 100}%` }} />
               ))}
            </div>
          )}
          
          {capsule.type === "VIDEO" && capsule.mediaUrl && (
            <div className="w-full aspect-video rounded overflow-hidden bg-black/40 border border-white/5 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
              <Play className="size-6 text-red-400/80 z-10" />
            </div>
          )}

          {capsule.content && (
             <p className="text-[13px] leading-relaxed text-foreground/74 font-light line-clamp-4">
               {capsule.content}
             </p>
          )}

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5 font-mono text-[10px] text-foreground/48">
            <span>{new Date(capsule.createdAt).toLocaleDateString()}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-500/76">Click to expand</span>
          </div>
        </div>
      </ArtifactBase>
    </>
  );
}

const NODE_TYPES = {
  capsule: CapsuleNode,
};

function ExpandedCapsuleCard({
  capsule,
  onClose,
}: {
  capsule: TimeCapsule;
  onClose: () => void;
}) {
  const { Icon, iconClassName } = getCapsulePresentation(capsule);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-0 top-0 inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-foreground/55 transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>

      <div className="pr-14">
        <div className="flex items-start gap-4 border-b border-white/7 pb-5">
          <div className={`mt-1 flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/25 ${iconClassName}`}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-foreground/38">
              Time Capsule Artifact
            </p>
            <h2 className="mt-2 font-mono text-lg font-semibold uppercase tracking-[0.14em] text-foreground/88 sm:text-xl">
              {capsule.title}
            </h2>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-500/50">
              Sealed on {new Date(capsule.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          {capsule.mediaUrl && (
            <div className="overflow-hidden rounded-xl border border-white/8 bg-black/30">
              {capsule.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={capsule.mediaUrl}
                  alt={capsule.title}
                  className="max-h-[420px] w-full object-contain"
                />
              ) : capsule.type === "VIDEO" ? (
                <video src={capsule.mediaUrl} controls className="w-full" />
              ) : capsule.type === "AUDIO" ? (
                <div className="p-5">
                  <audio src={capsule.mediaUrl} controls className="w-full" />
                </div>
              ) : (
                <a
                  href={capsule.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-36 items-center justify-center gap-3 px-6 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/72 transition-colors hover:text-amber-400"
                >
                  <ExternalLink className="size-4" />
                  Open Stored Attachment
                </a>
              )}
            </div>
          )}

          {capsule.content ? (
            <div className="rounded-xl border border-white/7 bg-black/18 px-5 py-4">
              <p className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground/76">
                {capsule.content}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/8 bg-black/12 px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/36">
              No written message was preserved in this capsule.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CAPSULE SVG ──────────────────────────────────────────────────────────────
function CapsuleObject({
  lidRef,
  lockBodyRef,
  lockHaspRef,
  lockDotRef,
  lockSealedRef,
  lockOpenRef,
  warmHaloRef,
}: {
  lidRef: React.RefObject<SVGGElement | null>;
  lockBodyRef: React.RefObject<SVGRectElement | null>;
  lockHaspRef: React.RefObject<SVGPathElement | null>;
  lockDotRef: React.RefObject<SVGCircleElement | null>;
  lockSealedRef: React.RefObject<SVGTextElement | null>;
  lockOpenRef: React.RefObject<SVGTextElement | null>;
  warmHaloRef: React.RefObject<SVGRadialGradientElement | null>;
}) {
  return (
    <svg viewBox="0 0 280 420" className="w-full h-full" xmlns="http://www.w3.org/2000/svg"
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
      <text x="140" y="229" textAnchor="middle" fontSize="4.8" fill={COPPER} fillOpacity="0.48" fontFamily="monospace" letterSpacing="2">ARCHIVE UNIT #0042</text>
      <text x="140" y="240" textAnchor="middle" fontSize="4.2" fill={COPPER} fillOpacity="0.42" fontFamily="monospace" letterSpacing="1.5">PRESERVED · SEALED · PERPETUAL</text>
      <text x="140" y="237" textAnchor="middle" fontSize="3.5" fill={COPPER} fillOpacity="0.3" fontFamily="monospace" letterSpacing="1.5">PRESERVED · SEALED · PERPETUAL</text>
      
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
        
        {/* Lock icon body - animated red → green via React ref */}
        <rect ref={lockBodyRef as any} x="132" y="100" width="16" height="11" rx="1.8" fill="none" stroke="#ef4444" strokeWidth="1.1" strokeOpacity="0.85" />
        <path ref={lockHaspRef as any} d="M134.5 100 Q134.5 95.5 140 95.5 Q145.5 95.5 145.5 100" fill="none" stroke="#ef4444" strokeWidth="1.1" strokeLinecap="round" />
        <circle ref={lockDotRef as any} cx="140" cy="106" r="1.8" fill="#ef4444" fillOpacity="0.75" />
        <text ref={lockSealedRef as any} x="140" y="122" textAnchor="middle" fontSize="5.2" fill="#ef4444" fillOpacity="0.62" fontFamily="monospace" letterSpacing="2">SEALED</text>
        <text ref={lockOpenRef as any} x="140" y="122" textAnchor="middle" fontSize="5.2" fill="#22c55e" fillOpacity="0" fontFamily="monospace" letterSpacing="2">OPEN</text>

        <ellipse cx="140" cy="38" rx="78" ry="5.5" fill="white" fillOpacity="0.025" />
        <line x1="30" y1="132" x2="250" y2="132" stroke="url(#tc-seam)" strokeWidth="1" />
      </g>
    </svg>
  );
}

// ─── MAIN UNSEAL COMPONENT ────────────────────────────────────────────────────────
export function UnsealClient({ project, capsules }: { project: Project; capsules: TimeCapsule[] }) {
  const capsuleRef    = useRef<HTMLDivElement>(null);
  const lidRef        = useRef<SVGGElement>(null);
  const warmHaloRef   = useRef<SVGRadialGradientElement>(null);
  const lockBodyRef   = useRef<SVGRectElement>(null);
  const lockHaspRef   = useRef<SVGPathElement>(null);
  const lockDotRef    = useRef<SVGCircleElement>(null);
  const lockSealedRef = useRef<SVGTextElement>(null);
  const lockOpenRef   = useRef<SVGTextElement>(null);
  const warmGlowDiv   = useRef<HTMLDivElement>(null);
  const warmHaloDiv   = useRef<HTMLDivElement>(null);

  const [opened, setOpened] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null);

  useEffect(() => {
    document.body.style.overflow = selectedCapsule ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCapsule]);

  // Generate nodes from actual DB capsules
  const initialNodes = useMemo(() => {
    // Generate positions in a scattered circular radius around 0,0
    return capsules.map((capsule, i) => {
      const angle = (i / capsules.length) * Math.PI * 2;
      const radius = 250 + Math.random() * 150;
      return {
        id: capsule.id,
        type: "capsule",
        position: {
          x: Math.cos(angle) * radius - 110,
          y: Math.sin(angle) * radius - 80,
        },
        data: {
          open: false,
          delay: 0.2 + (i * 0.15), // Staggered delays
          capsule,
          onNodeClick: (currentCapsule: TimeCapsule) => setSelectedCapsule(currentCapsule),
        },
        draggable: false,
        selectable: false,
      };
    });
  }, [capsules]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfViewport, setRfViewport] = useState({ x: 512, y: 300, zoom: 1 });
  const memoizedNodeTypes = useMemo(() => NODE_TYPES, []);
  
  useEffect(() => {
    setRfViewport({ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 });
  }, []);

  const handleUnlock = () => {
    if (opened || animating) return;
    setAnimating(true);
    
    const tl = gsap.timeline({
      onComplete: () => {
        setOpened(true);
        setAnimating(false);
        // Sync nodes to 'open' state to trigger Framer Motion
        setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, open: true }, draggable: true })));
      }
    });

    // 1. Lock panel pulse
    tl.to(".tc-lock-panel", { scale: 1.06, transformOrigin: "center", ease: "power1.inOut", duration: 0.3 })
      .to(".tc-lock-panel", { scale: 1, ease: "power1.inOut", duration: 0.3 });

    // 2. Lock changes color red → green
    tl.to(lockBodyRef.current, { stroke: "#22c55e", strokeOpacity: 0.9, duration: 0.3 }, "+=0.1")
      .to(lockHaspRef.current, { stroke: "#22c55e", y: -8, ease: "power2.out", duration: 0.4 }, "<")
      .to(lockDotRef.current, { fill: "#22c55e", duration: 0.3 }, "<")
      .to(lockSealedRef.current, { fillOpacity: 0, duration: 0.2 }, "<")
      .to(lockOpenRef.current, { fillOpacity: 0.75, duration: 0.2 }, "+=0.1");

    // 3. Lid rotates back (mechanical, heavy)
    tl.to(lidRef.current, { rotationX: -115, ease: "power3.inOut", duration: 1.2 }, "+=0.3")
      // Simultaneously: internal glow warms the body
      .to(warmGlowDiv.current, { opacity: 1, ease: "power2.out", duration: 0.8 }, "-=1.0")
      .to(warmHaloDiv.current, { opacity: 0.85, scale: 1.18, ease: "power2.out", duration: 1.0 }, "-=1.0");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
      {/* ── ATMOSPHERE ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-b from-[#070502] via-[#0c0804] to-[#060503]" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-175 h-112.5 bg-[radial-gradient(ellipse_at_top,rgba(160,90,15,0.14)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(0,0,0,0.9)_100%)]" />
      </div>

      {/* Floating dust */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full bg-amber-400/20"
            style={{ left: `${10 + (i * 71) % 80}%`, bottom: `${(i * 29) % 80}%`, width: 1 + (i % 3) * 0.6, height: 1 + (i % 3) * 0.6 }}
            animate={{ y: [0, -(35 + (i % 5) * 18), 0], opacity: [0.18, 0.45, 0.18] }}
            transition={{ duration: 8 + (i * 1.1) % 11, delay: (i * 0.6) % 7, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── HEADER ── */}
      <div className="absolute top-8 left-8 z-50">
         <Link href={`/project/${project.slug}`} className="font-mono text-xs text-foreground/40 hover:text-amber-500 transition-colors">
            ← Back to {project.title}
         </Link>
      </div>

      {/* ── INTERACTIVE AREA ── */}
      <div className="relative flex items-center justify-center w-full h-full min-h-150 z-30">
        <div ref={warmHaloDiv} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-85 h-85 rounded-full opacity-0" style={{ background: "radial-gradient(ellipse at center,rgba(251,191,36,0.18) 0%,rgba(180,100,20,0.07) 55%,transparent 78%)" }} />
        <div ref={warmGlowDiv} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[-42%] w-47.5 h-55 opacity-0 rounded-b-xl" style={{ background: "radial-gradient(ellipse at top,rgba(251,191,36,0.30) 0%,rgba(180,100,20,0.12) 60%,transparent 100%)" }} />

        <div ref={capsuleRef} className="relative z-10 flex items-center justify-center" style={{ perspective: "900px", perspectiveOrigin: "center 40%" }}>
          <div className="w-47.5 md:w-60 lg:w-70 aspect-280/420">
            <CapsuleObject
              lidRef={lidRef} lockBodyRef={lockBodyRef} lockHaspRef={lockHaspRef} lockDotRef={lockDotRef} lockSealedRef={lockSealedRef} lockOpenRef={lockOpenRef} warmHaloRef={warmHaloRef}
            />
          </div>
        </div>

        {/* ── REACT FLOW CANVAS ── */}
        <div className="absolute inset-0 z-20" style={{ pointerEvents: opened ? "auto" : "none" }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes} edges={[]} nodeTypes={memoizedNodeTypes} onNodesChange={onNodesChange}
              defaultViewport={rfViewport}
              panOnDrag={opened}
              panOnScroll={false}
              zoomOnScroll={opened}
              zoomOnPinch={opened}
              preventScrolling={true}
              minZoom={0.45}
              maxZoom={2.2}
              nodesDraggable={opened}
              elementsSelectable={false}
              nodesConnectable={false}
              style={{ background: "transparent" }}
              proOptions={{ hideAttribution: true }}
            />
          </ReactFlowProvider>
        </div>
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <AnimatePresence>
        {selectedCapsule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-90 flex items-center justify-center bg-black/78 p-4 backdrop-blur-md md:p-8"
            onClick={() => setSelectedCapsule(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.28, ease: CINEMATIC_EASE }}
              className="max-h-[88vh] w-full max-w-3xl overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <ArtifactBase
                open={true}
                delay={0}
                label={selectedCapsule.type}
                accentColor={getCapsulePresentation(selectedCapsule).accentColor}
                className="cursor-default"
              >
                <ExpandedCapsuleCard
                  capsule={selectedCapsule}
                  onClose={() => setSelectedCapsule(null)}
                />
              </ArtifactBase>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-12 flex flex-col items-center z-50">
         {!opened && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.44em] text-amber-500/42 mb-6">Archive Vault</p>
              {capsules.length === 0 ? (
                 <div className="text-center">
                   <p className="text-foreground/46 font-mono text-sm mb-4">Vault is empty.</p>
                 </div>
              ) : (
                 <Button onClick={handleUnlock} disabled={animating} size="lg" className="bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 px-12 h-14 rounded-full font-mono tracking-widest gap-3 shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all">
                   <LockOpen className="size-4" />
                   {animating ? "UNSEALING..." : "UNSEAL"}
                 </Button>
              )}
            </motion.div>
         )}
         
         <motion.p initial={{ opacity: 0 }} animate={{ opacity: opened ? 1 : 0 }} className="font-mono text-[11px] uppercase tracking-[0.32em] text-amber-500/52">
            Drag to pan · Scroll to zoom
         </motion.p>
      </div>
    </div>
  );
}
