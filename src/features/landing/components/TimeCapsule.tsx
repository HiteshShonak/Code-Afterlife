"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  NodeTypes,
  NodeProps,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CINEMATIC_EASE } from "@/lib/utils/animation";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// theme
const COPPER = "#b87333";

// artifact node data
type ArtifactNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  draggable: boolean;
  selectable: boolean;
};

// node positions
function buildNodes(open: boolean): ArtifactNode[] {
  return [
    {
      id: "msg",
      type: "message",
      position: { x: -460, y: -200 },
      data: {
        open,
        delay: 0,
        label: "MESSAGE TO FUTURE SELF",
        content: `"If this works someday, don't remove the weird onboarding — it was the only part users actually remembered."`,
        author: "— David, Apr 2022",
      },
      draggable: open,
      selectable: false,
    },
    {
      id: "readme",
      type: "readme",
      position: { x: 220, y: -230 },
      data: {
        open,
        delay: 0.14,
        label: "README.md · v0.4.2",
        content: `## Vision\nA calm, focused space for deep work.\nNo notifications. No distractions.\nJust you and the task.\n\n## Status\n🟡 Stalled — dependencies broke.`,
      },
      draggable: open,
      selectable: false,
    },
    {
      id: "commits",
      type: "commits",
      position: { x: -460, y: 80 },
      data: {
        open,
        delay: 0.26,
        label: "COMMIT TIMELINE",
        commits: [
          { hash: "a3f1b2", msg: "Initial commit — here we go", date: "Mar 12, 2021" },
          { hash: "9c4d71", msg: "First deploy 🚀", date: "Apr 03, 2021" },
          { hash: "e82aa0", msg: "Database rewrite (again)", date: "Nov 14, 2021" },
          { hash: "1f0022", msg: "Final commit", date: "Feb 28, 2022" },
        ],
      },
      draggable: open,
      selectable: false,
    },
    {
      id: "voice",
      type: "voice",
      position: { x: 220, y: 60 },
      data: {
        open,
        delay: 0.38,
        label: "VOICE RECORDING",
        title: "Final thoughts — Feb 28",
        duration: "2:14",
      },
      draggable: open,
      selectable: false,
    },
    {
      id: "roadmap",
      type: "roadmap",
      position: { x: -120, y: 260 },
      data: {
        open,
        delay: 0.48,
        label: "ROADMAP · FROZEN",
        items: [
          { done: true,  text: "Auth system" },
          { done: true,  text: "Core focus timer" },
          { done: false, text: "Team collaboration" },
          { done: false, text: "Mobile app" },
          { done: false, text: "API integrations" },
        ],
      },
      draggable: open,
      selectable: false,
    },
  ];
}

// artifact card base
function ArtifactBase({
  open,
  delay,
  label,
  children,
  accentColor = "rgba(251,191,36,0.22)",
}: {
  open: boolean;
  delay: number;
  label: string;
  children: React.ReactNode;
  accentColor?: string;
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
      className="nodrag-wrapper rounded-xl backdrop-blur-sm shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
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

// message to self node
function MessageNode({ data }: NodeProps) {
  return (
    <>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <ArtifactBase open={!!data.open} delay={data.delay as number} label={data.label as string}
        accentColor="rgba(251,191,36,0.25)">
        <blockquote className="text-[11px] leading-relaxed text-foreground/80 font-light italic w-[210px]">
          {data.content as string}
        </blockquote>
        <p className="mt-2.5 font-mono text-[9px] text-amber-500/45">{data.author as string}</p>
      </ArtifactBase>
    </>
  );
}

// readme node
function ReadmeNode({ data }: NodeProps) {
  return (
    <>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <ArtifactBase open={!!data.open} delay={data.delay as number} label={data.label as string}
        accentColor="rgba(255,255,255,0.08)">
        <pre className="text-[9.5px] leading-[1.65] text-foreground/60 whitespace-pre-wrap font-mono w-[195px]">
          {data.content as string}
        </pre>
      </ArtifactBase>
    </>
  );
}

// commits node
function CommitsNode({ data }: NodeProps) {
  const commits = data.commits as { hash: string; msg: string; date: string }[];
  return (
    <>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <ArtifactBase open={!!data.open} delay={data.delay as number} label={data.label as string}
        accentColor="rgba(255,255,255,0.08)">
        <div className="flex flex-col gap-2.5 w-[210px]">
          {commits.map((c) => (
            <div key={c.hash} className="flex items-start gap-2">
              <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500/50" />
              <div>
                <div className="font-mono text-[10px] text-foreground/75 leading-snug">{c.msg}</div>
                <div className="font-mono text-[8.5px] text-foreground/30">{c.hash} · {c.date}</div>
              </div>
            </div>
          ))}
        </div>
      </ArtifactBase>
    </>
  );
}

// voice waveform node
function VoiceNode({ data }: NodeProps) {
  const bars = useMemo(
    () => Array.from({ length: 28 }, (_, i) => 10 + Math.abs(Math.sin(i * 0.72 + 1.1) * 26) + Math.abs(Math.cos(i * 0.41) * 10)),
    []
  );
  return (
    <>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <ArtifactBase open={!!data.open} delay={data.delay as number} label={data.label as string}
        accentColor="rgba(251,191,36,0.18)">
        <div className="w-[195px]">
          <div className="mb-2 font-mono text-[9.5px] text-foreground/60">{data.title as string}</div>
          <div className="flex items-center gap-[2px] h-9">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-full bg-amber-400/55"
                style={{ height: `${h}%`, opacity: 0.25 + (i / bars.length) * 0.75 }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[8.5px] text-foreground/30">
            <span>▶ play</span>
            <span>{data.duration as string}</span>
          </div>
        </div>
      </ArtifactBase>
    </>
  );
}

// roadmap node
function RoadmapNode({ data }: NodeProps) {
  const items = data.items as { done: boolean; text: string }[];
  return (
    <>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      <ArtifactBase open={!!data.open} delay={data.delay as number} label={data.label as string}
        accentColor="rgba(255,255,255,0.07)">
        <div className="flex flex-col gap-2 w-[190px]">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`size-3 rounded border flex items-center justify-center shrink-0 ${
                item.done ? "border-amber-500/40 bg-amber-500/10" : "border-foreground/12"
              }`}>
                {item.done && <div className="size-1.5 rounded-sm bg-amber-500/70" />}
              </div>
              <span className={`font-mono text-[9.5px] ${
                item.done ? "text-foreground/40 line-through" : "text-foreground/25"
              }`}>{item.text}</span>
            </div>
          ))}
        </div>
      </ArtifactBase>
    </>
  );
}

const NODE_TYPES: NodeTypes = {
  message: MessageNode,
  readme:  ReadmeNode,
  commits: CommitsNode,
  voice:   VoiceNode,
  roadmap: RoadmapNode,
};

// full screen canvas

function ArtifactCanvas({ open }: { open: boolean }) {
  const initial = useMemo(() => buildNodes(false), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial);

  // sync state
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, open },
        draggable: open,
      }))
    );
  }, [open, setNodes]);

  // compute viewport
  const [rfViewport, setRfViewport] = useState({ x: 512, y: 300, zoom: 1 });
  useEffect(() => {
    setRfViewport({ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 });
  }, []);

  return (
    <div
      className="absolute inset-0 z-20"
      // block pointer events
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        // viewport
        defaultViewport={rfViewport}
        // disable pan/zoom
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        // interaction
        nodesDraggable={open}
        elementsSelectable={false}
        nodesConnectable={false}
        // invisible bg
        style={{ background: "transparent" }}
        proOptions={{ hideAttribution: true }}
      >
        {/* no controls */}
      </ReactFlow>
    </div>
  );
}

// animated refs

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
        {/* body gradient */}
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
        {/* inner glow */}
        <radialGradient id="tc-inner-glow" cx="50%" cy="50%" r="55%" ref={warmHaloRef as any}>
          <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0" />
          <stop offset="60%"  stopColor="#92400e" stopOpacity="0" />
          <stop offset="100%" stopColor="#451a03" stopOpacity="0" />
        </radialGradient>
        <clipPath id="tc-body-clip">
          <rect x="30" y="132" width="220" height="270" rx="8" />
        </clipPath>
      </defs>

      {/* body */}
      <rect x="30" y="132" width="220" height="270" rx="8" fill="url(#tc-body)" />
      {/* inner glow */}
      <rect x="30" y="132" width="220" height="270" rx="8"
        fill="url(#tc-inner-glow)" clipPath="url(#tc-body-clip)" />
      {/* horizontal ribs */}
      {[175, 220, 265, 310, 355].map((y) => (
        <rect key={y} x="30" y={y} width="220" height="1.5" rx="0.75"
          fill={COPPER} opacity="0.1" />
      ))}
      {/* side lines */}
      <line x1="37" y1="137" x2="37" y2="396" stroke="#0a0603" strokeWidth="2" opacity="0.7" />
      <line x1="243" y1="137" x2="243" y2="396" stroke="#0a0603" strokeWidth="2" opacity="0.7" />
      {/* identifier plate */}
      <rect x="75" y="200" width="130" height="44" rx="3"
        fill="#0f0905" stroke={COPPER} strokeWidth="0.5" strokeOpacity="0.32" />
      <text x="140" y="217" textAnchor="middle" fontSize="5.5"
        fill={COPPER} fillOpacity="0.65" fontFamily="monospace" letterSpacing="3">CODE · AFTERLIFE</text>
      <text x="140" y="228" textAnchor="middle" fontSize="4"
        fill={COPPER} fillOpacity="0.4" fontFamily="monospace" letterSpacing="2">ARCHIVE UNIT #0042</text>
      <text x="140" y="237" textAnchor="middle" fontSize="3.5"
        fill={COPPER} fillOpacity="0.3" fontFamily="monospace" letterSpacing="1.5">PRESERVED · SEALED · PERPETUAL</text>
      {/* status leds */}
      {[88, 102].map((cx, i) => (
        <g key={cx}>
          <circle cx={cx} cy="358" r="3" fill="#100804" stroke={COPPER} strokeWidth="0.4" strokeOpacity="0.4" />
          <circle cx={cx} cy="358" r="1.4" fill={i === 0 ? "#ef4444" : "#fbbf24"} opacity="0.55">
            <animate attributeName="opacity" values="0.55;0.12;0.55" dur={i === 0 ? "2.2s" : "3.3s"} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {/* bottom base */}
      <rect x="22" y="395" width="236" height="11" rx="3.5" fill="#180e06"
        stroke={COPPER} strokeWidth="0.4" strokeOpacity="0.28" />
      {/* hinges */}
      {[{ x: 23 }, { x: 247 }].map(({ x }, i) => (
        <g key={i}>
          <rect x={x} y="148" width="10" height="22" rx="2"
            fill="#140d06" stroke={COPPER} strokeWidth="0.4" strokeOpacity="0.45" />
          <circle cx={x + 5} cy="159" r="2.2" fill={COPPER} fillOpacity="0.35" />
        </g>
      ))}
      {/* seam glow */}
      <line x1="30" y1="133" x2="250" y2="133" stroke="url(#tc-seam)" strokeWidth="1.5" />

      {/* lid */}
      <g ref={lidRef as any} style={{ transformOrigin: "140px 132px" }}>
        <rect x="30" y="30" width="220" height="104" rx="8" fill="url(#tc-lid)" />
        {/* lid ribs */}
        {[54, 76, 98].map((y) => (
          <rect key={y} x="30" y={y} width="220" height="1.5" rx="0.75"
            fill={COPPER} opacity="0.09" />
        ))}
        <line x1="37" y1="36" x2="37" y2="130" stroke="#0a0603" strokeWidth="2" opacity="0.7" />
        <line x1="243" y1="36" x2="243" y2="130" stroke="#0a0603" strokeWidth="2" opacity="0.7" />
        {/* lid handle */}
        <rect x="108" y="36" width="64" height="7" rx="3.5"
          fill="#160e06" stroke={COPPER} strokeWidth="0.5" strokeOpacity="0.42" />
        <rect x="120" y="38" width="40" height="3" rx="1.5" fill={COPPER} fillOpacity="0.18" />

        {/* lock panel */}
        <rect className="tc-lock-panel" x="113" y="88" width="54" height="30" rx="3"
          fill="#0d0804" stroke={COPPER} strokeWidth="0.4" strokeOpacity="0.35" />

        {/* lock body */}
        <rect ref={lockBodyRef as any} x="132" y="100" width="16" height="11" rx="1.8"
          fill="none" stroke="#ef4444" strokeWidth="1.1" strokeOpacity="0.85" />

        {/* lock hasp */}
        <path ref={lockHaspRef as any}
          d="M134.5 100 Q134.5 95.5 140 95.5 Q145.5 95.5 145.5 100"
          fill="none" stroke="#ef4444" strokeWidth="1.1" strokeLinecap="round" />

        {/* keyhole dot */}
        <circle ref={lockDotRef as any} cx="140" cy="106" r="1.8" fill="#ef4444" fillOpacity="0.75" />

        {/* sealed label */}
        <text ref={lockSealedRef as any} x="140" y="122" textAnchor="middle" fontSize="4"
          fill="#ef4444" fillOpacity="0.55" fontFamily="monospace" letterSpacing="2">SEALED</text>

        {/* open label */}
        <text ref={lockOpenRef as any} x="140" y="122" textAnchor="middle" fontSize="4"
          fill="#22c55e" fillOpacity="0" fontFamily="monospace" letterSpacing="2">OPEN</text>

        {/* lid highlight */}
        <ellipse cx="140" cy="38" rx="78" ry="5.5" fill="white" fillOpacity="0.025" />
        {/* seam lid base */}
        <line x1="30" y1="132" x2="250" y2="132" stroke="url(#tc-seam)" strokeWidth="1" />
      </g>

      {/* ambient dust motes */}
      {[
        { cx: 58,  cy: 78,  r: 0.8, dur: "4.1s"  },
        { cx: 202, cy: 62,  r: 0.6, dur: "5.7s"  },
        { cx: 88,  cy: 380, r: 0.7, dur: "3.9s"  },
        { cx: 222, cy: 362, r: 0.5, dur: "6.3s"  },
        { cx: 48,  cy: 218, r: 0.6, dur: "4.8s"  },
        { cx: 240, cy: 250, r: 0.8, dur: "5.2s"  },
      ].map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={COPPER} fillOpacity="0.38">
          <animate attributeName="opacity" values="0.38;0.05;0.38" dur={d.dur} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

// main section
export function TimeCapsule() {
  const sectionRef    = useRef<HTMLElement>(null);
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
  const headlineRef   = useRef<HTMLDivElement>(null);

  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const openRef = useRef(false);

  const isHeadlineInView = useInView(headlineRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {

      // phase 1
      gsap.fromTo(capsuleRef.current,
        { y: 70, opacity: 0, filter: "blur(10px)" },
        {
          y: 0, opacity: 1, filter: "blur(0px)",
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "18% top",
            scrub: 1.5,
          },
        }
      );

      // phase 2
      gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "18% top",
          end: "32% top",
          scrub: 1.2,
        },
      })
        .to(".tc-lock-panel", { scale: 1.06, transformOrigin: "center", ease: "power1.inOut" })
        .to(".tc-lock-panel", { scale: 1, ease: "power1.inOut" });

      // phase 3
      const openTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "32% top",
          end: "62% top",
          scrub: 2.0,
          onUpdate(self) {
            if (self.progress > 0.82 && !openRef.current) {
              openRef.current = true;
              setCapsuleOpen(true);
            } else if (self.progress < 0.82 && openRef.current) {
              openRef.current = false;
              setCapsuleOpen(false);
            }
          },
        },
      });

      openTl
        // lock changes color
        .to(lockBodyRef.current, {
          stroke: "#22c55e", strokeOpacity: 0.9,
          ease: "power1.inOut",
          duration: 0.25,
        }, 0)
        .to(lockHaspRef.current, {
          stroke: "#22c55e",
          // hasp lifts
          y: -8,
          ease: "power2.out",
          duration: 0.35,
        }, 0)
        .to(lockDotRef.current, {
          fill: "#22c55e",
          ease: "power1.inOut",
          duration: 0.25,
        }, 0)
        // sealed to invisible
        .to(lockSealedRef.current, { fillOpacity: 0, duration: 0.2 }, 0.05)
        // open to visible
        .to(lockOpenRef.current,   { fillOpacity: 0.75, duration: 0.2 }, 0.15)

        // lid rotates
        .to(lidRef.current, {
          rotationX: -115,
          ease: "power3.inOut",
          duration: 0.75,
        }, 0.22)

        // internal glow
        .to(warmGlowDiv.current, {
          opacity: 1,
          ease: "power2.out",
          duration: 0.5,
        }, 0.5)
        .to(warmHaloDiv.current, {
          opacity: 0.85,
          scale: 1.18,
          ease: "power2.out",
          duration: 0.6,
        }, 0.45);

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="capsule"
      className="relative bg-background"
      style={{ minHeight: "520vh" }}
    >
      {/* sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center" style={{ position: "sticky" }}>

        {/* atmosphere */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#070502] via-[#0c0804] to-[#060503]" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[450px]
            bg-[radial-gradient(ellipse_at_top,rgba(160,90,15,0.14)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(0,0,0,0.9)_100%)]" />
        </div>

        {/* floating dust — CSS-only, zero JS RAF cost */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <style>{`
            @keyframes tc-dust {
              0%   { transform: translateY(0)   translateX(0);   opacity: 0.18; }
              50%  { opacity: 0.45; }
              100% { transform: translateY(var(--tc-dy)) translateX(var(--tc-dx)); opacity: 0.18; }
            }
          `}</style>
          {Array.from({ length: 18 }).map((_, i) => {
            const dy = -(35 + (i % 5) * 18);
            const dx = ((i % 3) - 1) * 8;
            const dur = 8 + (i * 1.1) % 11;
            const delay = (i * 0.6) % 7;
            const sz = 1 + (i % 3) * 0.6;
            return (
              <div
                key={i}
                className="absolute rounded-full bg-amber-400/20"
                style={{
                  left: `${10 + (i * 71) % 80}%`,
                  bottom: `${(i * 29) % 80}%`,
                  width: sz,
                  height: sz,
                  ["--tc-dy" as string]: `${dy}px`,
                  ["--tc-dx" as string]: `${dx}px`,
                  animation: `tc-dust ${dur}s ease-in-out ${delay}s infinite`,
                  willChange: "transform, opacity",
                }}
              />
            );
          })}
        </div>


        {/* capsule canvas area */}
        <div className="relative flex items-center justify-center w-full h-full">

          {/* warm halo */}
          <div ref={warmHaloDiv}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full opacity-0"
            style={{ background: "radial-gradient(ellipse at center,rgba(251,191,36,0.18) 0%,rgba(180,100,20,0.07) 55%,transparent 78%)" }}
          />

          {/* internal warmth */}
          <div ref={warmGlowDiv}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[42%] w-[190px] h-[220px] opacity-0 rounded-b-xl"
            style={{ background: "radial-gradient(ellipse at top,rgba(251,191,36,0.30) 0%,rgba(180,100,20,0.12) 60%,transparent 100%)" }}
          />

          {/* capsule svg */}
          <div
            ref={capsuleRef}
            className="relative z-10 flex items-center justify-center"
            style={{
              opacity: 0,
              perspective: "900px",
              perspectiveOrigin: "center 40%",
            }}
          >
            <div className="w-[190px] md:w-[240px] lg:w-[280px] aspect-[280/420]">
              <CapsuleObject
                lidRef={lidRef}
                lockBodyRef={lockBodyRef}
                lockHaspRef={lockHaspRef}
                lockDotRef={lockDotRef}
                lockSealedRef={lockSealedRef}
                lockOpenRef={lockOpenRef}
                warmHaloRef={warmHaloRef}
              />
            </div>
          </div>

          {/* artifact canvas */}
          <ReactFlowProvider>
            <ArtifactCanvas open={capsuleOpen} />
          </ReactFlowProvider>

        </div>

        {/* bottom headline */}
        <div ref={headlineRef} className="absolute bottom-0 inset-x-0 z-30 pointer-events-none flex flex-col items-center pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={isHeadlineInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 2, delay: 0.4, ease: CINEMATIC_EASE }}
            className="relative text-center px-6"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-amber-500/38 mb-3">Time Capsule</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground/90 text-balance leading-tight max-w-xl mx-auto">
              The code stopped.<br />
              <span className="text-foreground/40">The story didn't.</span>
            </h2>
            <p className="mt-4 text-sm md:text-base text-foreground/32 max-w-[36ch] mx-auto leading-relaxed">
              Every project leaves behind memories worth preserving.
            </p>

            {/* drag hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: capsuleOpen ? 1 : 0 }}
              transition={{ duration: 1.2, ease: CINEMATIC_EASE }}
              aria-hidden={!capsuleOpen}
              className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+0.75rem)] whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.4em] text-amber-500/40"
            >
              Drag the memories · Explore the archive
            </motion.p>
          </motion.div>
        </div>

        {/* edge fades */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-background to-transparent z-40" />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-background to-transparent z-40" />
      </div>

      {/* personal message */}
      <PersonalMessageReveal />
    </section>
  );
}

// personal message
function PersonalMessageReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <div ref={ref} className="relative flex flex-col items-center justify-center px-6 py-48 md:py-64 text-center bg-background">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px]
        bg-[radial-gradient(ellipse_at_center,rgba(180,100,20,0.07)_0%,transparent_70%)] blur-3xl" />

      <motion.div initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.8, ease: CINEMATIC_EASE }}
        className="mb-12 w-24 h-px bg-gradient-to-r from-transparent via-amber-500/38 to-transparent origin-center" />

      <motion.p initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.6, delay: 0.2, ease: CINEMATIC_EASE }}
        className="mb-8 font-mono text-[9px] uppercase tracking-[0.5em] text-amber-500/42">
        Preserved inside · ZenithOS Time Capsule
      </motion.p>

      <motion.blockquote
        initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
        animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 2.4, delay: 0.4, ease: CINEMATIC_EASE }}
        className="relative max-w-2xl text-2xl md:text-[2.5rem] font-light italic tracking-tight text-foreground/80 leading-[1.42]">
        <span className="absolute -top-5 -left-4 text-6xl font-serif text-amber-500/12 select-none">"</span>
        If someone finds this project again, please keep it open source.
        It was meant to help people{" "}
        <span className="text-amber-400/80 not-italic">focus</span>{" "}
        — not to be sold for parts.
        <span className="absolute -bottom-3 -right-3 text-6xl font-serif text-amber-500/12 select-none">"</span>
      </motion.blockquote>

      <motion.figcaption
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 2, delay: 1.0, ease: CINEMATIC_EASE }}
        className="mt-14 flex flex-col items-center gap-3">
        <span className="size-1.5 rounded-full bg-amber-500/55 animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/28">
          Preserved in README.md · Oct 14, 2021
        </span>
        <span className="font-mono text-[11px] text-foreground/45">— David Chen, creator of ZenithOS</span>
      </motion.figcaption>

      <motion.div initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.8, delay: 0.8, ease: CINEMATIC_EASE }}
        className="mt-16 w-24 h-px bg-gradient-to-r from-transparent via-amber-500/28 to-transparent origin-center" />

      <motion.div initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.8, delay: 1.4, ease: CINEMATIC_EASE }}
        className="mt-16 flex flex-col items-center gap-4">
        <p className="text-sm text-foreground/32 max-w-[34ch] leading-relaxed">
          Create your own time capsule. Preserve what mattered.
        </p>
        <button className="relative group inline-flex items-center gap-3 border border-amber-500/20
          bg-amber-950/30 px-7 py-3.5 font-mono text-[10px] uppercase tracking-[0.3em]
          text-amber-400/65 backdrop-blur-sm transition-all duration-700
          hover:border-amber-500/40 hover:bg-amber-950/50 hover:text-amber-300/90">
          <span className="pointer-events-none absolute inset-0 -translate-x-full
            bg-gradient-to-r from-transparent via-amber-400/[0.04] to-transparent
            transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">Seal Your Capsule</span>
          <span className="relative transition-transform duration-500 group-hover:translate-x-1">→</span>
        </button>
      </motion.div>
    </div>
  );
}