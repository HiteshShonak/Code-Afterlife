"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CINEMATIC_EASE } from "@/lib/utils/animation";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// ─── PALETTE ──────────────────────────────────────────────────────────────────
// Emotional arc: grey/dead → desaturated violet → cold blue → bright cold teal
const GEN = {
  0: { dot: "#4b5563", border: "rgba(75,85,99,0.30)",   glow: "rgba(75,85,99,0.15)",    bg: "#0a0c10", text: "rgba(255,255,255,0.42)", badge: "ARCHIVED"  },
  1: { dot: "#6d6888", border: "rgba(109,104,136,0.32)", glow: "rgba(109,104,136,0.15)", bg: "#0c0d18", text: "rgba(255,255,255,0.68)", badge: "FORKED"    },
  2: { dot: "#4a7fb5", border: "rgba(74,127,181,0.38)",  glow: "rgba(74,127,181,0.18)",  bg: "#080f1c", text: "rgba(255,255,255,0.78)", badge: "ACTIVE"    },
  3: { dot: "#60a5fa", border: "rgba(96,165,250,0.42)",  glow: "rgba(96,165,250,0.22)",  bg: "#050d1c", text: "rgba(255,255,255,0.90)", badge: "THRIVING"  },
} as const;

// ─── LINEAGE DATA ─────────────────────────────────────────────────────────────
// Node positions in SVG viewBox "0 0 600 520"
// Each node card is centered at (cx, cy)
const NODE_W = 168;
const NODE_H =  72;

const NODES = [
  { id: "root",  name: "TaskBridge",  year: "2019", gen: 0 as const, cx: 300, cy:  52, note: "The original idea"           },
  { id: "focus", name: "FocusHub",    year: "2021", gen: 1 as const, cx: 148, cy: 200, note: "Inspired by TaskBridge"       },
  { id: "pulse", name: "WorkPulse",   year: "2022", gen: 1 as const, cx: 452, cy: 200, note: "Forked from TaskBridge"       },
  { id: "sync",  name: "SyncSpace",   year: "2023", gen: 2 as const, cx: 148, cy: 348, note: "Built on FocusHub's core"     },
  { id: "flow",  name: "FlowState",   year: "2024", gen: 3 as const, cx: 452, cy: 468, note: "Evolved from WorkPulse"       },
];

// Bezier edges between nodes — from source (cx, cy+NODE_H/2) to dest (cx, cy-NODE_H/2)
const EDGES = [
  { id: "e1", from: "root",  to: "focus", d: "M 300 88  C 300 144 148 144 148 164", gradId: "g-e1", c0: "#4b5563", c1: "#6d6888" },
  { id: "e2", from: "root",  to: "pulse", d: "M 300 88  C 300 144 452 144 452 164", gradId: "g-e2", c0: "#4b5563", c1: "#6d6888" },
  { id: "e3", from: "focus", to: "sync",  d: "M 148 236 C 148 292 148 292 148 312", gradId: "g-e3", c0: "#6d6888", c1: "#4a7fb5" },
  { id: "e4", from: "pulse", to: "flow",  d: "M 452 236 C 452 340 452 380 452 432", gradId: "g-e4", c0: "#6d6888", c1: "#60a5fa" },
];

// Pre-estimated path lengths (getTotalLength runs in useLayoutEffect)
const APPROX_LEN: Record<string, number> = {
  e1: 240, e2: 240, e3: 130, e4: 220,
};

// ─── SVG NODE CARD ────────────────────────────────────────────────────────────
function LineageNode({
  node,
  hovered,
  onHover,
}: {
  node: typeof NODES[number];
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const c  = GEN[node.gen];
  const nx = node.cx - NODE_W / 2;
  const ny = node.cy - NODE_H / 2;

  // Determine if this node is an ancestor of the hovered one
  const ancestors: Record<string, string[]> = {
    focus: ["root"],
    pulse: ["root"],
    sync:  ["focus", "root"],
    flow:  ["pulse", "root"],
  };
  const isHovered  = hovered === node.id;
  const isAncestor = hovered !== null && (ancestors[hovered] ?? []).includes(node.id);
  const isDimmed   = hovered !== null && !isHovered && !isAncestor;

  return (
    <g
      transform={`translate(${nx}, ${ny})`}
      className={`lg-node-${node.id}`}
      style={{ cursor: "default" }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Outer glow halo — brightens on hover */}
      <rect
        x="-6" y="-6" width={NODE_W + 12} height={NODE_H + 12} rx="16"
        fill={c.glow}
        opacity={isHovered ? 0.7 : isAncestor ? 0.45 : isDimmed ? 0.03 : 0.15}
        filter="url(#lg-glow)"
        style={{ transition: "opacity 0.5s ease" }}
      />

      {/* Card background */}
      <rect
        width={NODE_W} height={NODE_H} rx="11"
        fill={c.bg}
        stroke={c.border}
        strokeWidth={isHovered ? 1.4 : 0.9}
        opacity={isDimmed ? 0.25 : 1}
        style={{ transition: "stroke-width 0.3s ease, opacity 0.4s ease" }}
      />

      {/* Status dot — pulses for gen>0 */}
      <circle cx="14" cy="14" r="3.2" fill={c.dot} opacity={isDimmed ? 0.2 : 1}
        style={{ transition: "opacity 0.4s ease" }}>
        {node.gen > 0 && (
          <animate attributeName="opacity" values="1;0.35;1"
            dur={`${2.2 + node.gen * 0.7}s`} repeatCount="indefinite" />
        )}
      </circle>

      {/* Project name */}
      <text x="26" y="20" fontSize="12" fontWeight="700"
        fill={c.text} fontFamily="monospace"
        opacity={isDimmed ? 0.25 : 1}
        style={{ transition: "opacity 0.4s ease" }}>
        {node.name}
      </text>

      {/* Year */}
      <text x="14" y="36" fontSize="9" fill="rgba(255,255,255,0.25)"
        fontFamily="monospace" letterSpacing="1.2"
        opacity={isDimmed ? 0.15 : 1}
        style={{ transition: "opacity 0.4s ease" }}>
        {node.year}
      </text>

      {/* Status badge */}
      <rect x="13" y="46" width={54} height={16} rx="8"
        fill={c.glow} stroke={c.border} strokeWidth="0.55"
        opacity={isDimmed ? 0.15 : 1}
        style={{ transition: "opacity 0.4s ease" }} />
      <text x="40" y="57" fontSize="7.2" fill={c.dot}
        fontFamily="monospace" letterSpacing="1.5" textAnchor="middle"
        opacity={isDimmed ? 0.15 : 1}
        style={{ transition: "opacity 0.4s ease" }}>
        {c.badge}
      </text>

      {/* Hover: note text */}
      <text
        x={NODE_W / 2} y="67" fontSize="7.8" textAnchor="middle"
        fill="rgba(255,255,255,0.30)" fontFamily="monospace"
        opacity={isHovered ? 1 : 0}
        style={{ transition: "opacity 0.3s ease" }}>
        {node.note}
      </text>
    </g>
  );
}

// ─── SVG LINEAGE GRAPH ────────────────────────────────────────────────────────
function LineageGraph({ revealed }: { revealed: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});

  // Measure paths and animate on reveal
  useEffect(() => {
    EDGES.forEach((e) => {
      const el = pathRefs.current[e.id];
      if (!el) return;
      const len = el.getTotalLength?.() ?? APPROX_LEN[e.id];
      el.style.strokeDasharray  = String(len);
      el.style.strokeDashoffset = String(len);
    });
  }, []);

  useEffect(() => {
    if (!revealed) return;
    EDGES.forEach((e, i) => {
      const el = pathRefs.current[e.id];
      if (!el) return;
      const len = el.getTotalLength?.() ?? APPROX_LEN[e.id];
      gsap.to(el, { strokeDashoffset: 0, duration: 1.5, delay: 0.5 + i * 0.4, ease: "power2.inOut" });
    });
  }, [revealed]);

  // Ancestor lookup
  const ancestors: Record<string, string[]> = {
    focus: ["root"],
    pulse: ["root"],
    sync:  ["focus", "root"],
    flow:  ["pulse", "root"],
  };

  return (
    <svg
      viewBox="0 0 600 540"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Soft glow filter */}
        <filter id="lg-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="lg-glow-sm" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Per-edge gradients */}
        {EDGES.map((e) => (
          <linearGradient key={e.gradId} id={e.gradId} gradientUnits="userSpaceOnUse"
            x1={NODES.find(n => n.id === e.from)!.cx}
            y1={NODES.find(n => n.id === e.from)!.cy}
            x2={NODES.find(n => n.id === e.to)!.cx}
            y2={NODES.find(n => n.id === e.to)!.cy}
          >
            <stop offset="0%"   stopColor={e.c0} stopOpacity="0.35" />
            <stop offset="100%" stopColor={e.c1} stopOpacity="0.65" />
          </linearGradient>
        ))}

        {/* Subtle grid pattern */}
        <pattern id="lg-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none"
            stroke="rgba(147,197,253,0.035)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Grid backdrop */}
      <rect width="600" height="540" fill="url(#lg-grid)" />

      {/* ── EDGES ── */}
      {EDGES.map((e) => {
        const isActiveEdge = hovered !== null && (
          e.from === hovered || e.to === hovered ||
          (ancestors[hovered] ?? []).includes(e.from) && e.to === hovered
        );
        const isDimEdge = hovered !== null && !isActiveEdge;
        const toNode    = NODES.find(n => n.id === e.to)!;
        const toC       = GEN[toNode.gen];

        return (
          <g key={e.id}>
            {/* Base path — dash-animated on reveal */}
            <path
              ref={(el) => { pathRefs.current[e.id] = el; }}
              d={e.d}
              fill="none"
              stroke={`url(#${e.gradId})`}
              strokeWidth={isActiveEdge ? 1.6 : 1.0}
              strokeLinecap="round"
              style={{
                opacity: isDimEdge ? 0.12 : 0.50,
                transition: "stroke-width 0.4s ease, opacity 0.4s ease",
              }}
            />
            {/* Glow halo on path */}
            <path
              d={e.d}
              fill="none"
              stroke={toC.dot}
              strokeWidth="3"
              strokeLinecap="round"
              opacity={isActiveEdge ? 0.18 : 0.04}
              filter="url(#lg-glow)"
              style={{ transition: "opacity 0.4s ease", pointerEvents: "none" }}
            />
            {/* Flowing particle on each edge */}
            {revealed && (
              <circle r="2.2" fill={toC.dot} opacity="0.85" filter="url(#lg-glow-sm)">
                <animateMotion
                  dur={`${3.2 + EDGES.indexOf(e) * 0.7}s`}
                  begin={`${EDGES.indexOf(e) * 1.1}s`}
                  repeatCount="indefinite"
                  path={e.d}
                />
                <animate
                  attributeName="opacity"
                  values="0;0.85;0.85;0"
                  dur={`${3.2 + EDGES.indexOf(e) * 0.7}s`}
                  begin={`${EDGES.indexOf(e) * 1.1}s`}
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}

      {/* ── NODES ── */}
      {NODES.map((node) => (
        <LineageNode
          key={node.id}
          node={node}
          hovered={hovered}
          onHover={setHovered}
        />
      ))}
    </svg>
  );
}

// ─── PRE-COMPUTED AMBIENT PARTICLES ───────────────────────────────────────────
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left:  `${(i * 21 + 9) % 94}%`,
  top:   `${(i * 37 + 5) % 92}%`,
  size:  0.8 + (i % 4) * 0.4,
  color: i % 5 === 0 ? "#fbbf24" : i % 4 === 0 ? "#93c5fd" : "#e2e8f0",
  op:    0.05 + (i % 6) * 0.022,
  dur:   9 + (i % 10) * 1.3,
  delay: (i * 0.58) % 5.5,
  dy:    -(16 + (i % 7) * 9),
}));

// ─── MAIN SECTION ─────────────────────────────────────────────────────────────
export function Lineage() {
  const sectionRef   = useRef<HTMLElement>(null);
  const graphRef     = useRef<HTMLDivElement>(null);
  const leftTextRef  = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const revealedRef  = useRef(false);

  const isLeftInView  = useInView(leftTextRef,  { once: true, margin: "-60px" });
  const isGraphInView = useInView(graphRef,      { once: true, margin: "-80px" });

  // Trigger graph reveal
  useEffect(() => {
    if (isGraphInView && !revealedRef.current) {
      revealedRef.current = true;
      setTimeout(() => setRevealed(true), 200);
    }
  }, [isGraphInView]);

  // GSAP: staggered node entrance
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      NODES.forEach((node, i) => {
        gsap.from(`.lg-node-${node.id}`, {
          opacity: 0,
          scale: 0.72,
          transformOrigin: "center center",
          duration: 1.0,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: graphRef.current,
            start: "top 82%",
            toggleActions: "play none none none",
          },
          delay: 0.25 + i * 0.2,
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="lineage"
      className="relative border-t bg-[#030508] overflow-hidden"
      style={{ borderColor: "rgba(148,163,184,0.07)" }}
    >
      {/* ── BACKGROUND ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Cold radial base */}
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 90% 70% at 60% 45%, #0a1020 0%, #030508 70%)" }} />
        {/* Faint moonlit glow */}
        <div className="absolute left-[55%] top-[40%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px]"
          style={{ background: "radial-gradient(ellipse at center, rgba(59,130,246,0.025) 0%, transparent 65%)" }} />
        {/* Ambient particles */}
        {PARTICLES.map((p, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size, backgroundColor: p.color, opacity: 0 }}
            animate={{ y: [0, p.dy, 0], opacity: [0, p.op, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32 md:px-10">

        {/* ── HEADER ── */}
        <div ref={leftTextRef} className="mb-16 md:mb-20 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isLeftInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.5, ease: CINEMATIC_EASE }}
          >
            {/* Label */}
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-7 bg-slate-700" />
              <span className="font-mono text-[9.5px] uppercase tracking-[0.42em] text-slate-600">
                04 · Legacy
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-balance text-3xl md:text-5xl lg:text-[3.2rem] font-extrabold tracking-tight
              text-slate-200 leading-[1.1] mb-5">
              Some ideas{" "}
              <span className="text-slate-500 font-light italic">never really</span>{" "}
              disappear.
            </h2>

            <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-lg mb-2">
              Archived projects leave behind architecture, ideas, and unfinished thinking
              for future builders.
            </p>
            <p className="font-mono text-[10px] tracking-widest italic text-slate-700">
              The builder stopped. The idea didn't.
            </p>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isLeftInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 1.8, delay: 0.4, ease: CINEMATIC_EASE }}
            className="mt-10 h-px w-40 origin-left"
            style={{ background: "linear-gradient(to right, rgba(148,163,184,0.2), transparent)" }}
          />
        </div>

        {/* ── MAIN: LEGEND LEFT + GRAPH RIGHT ── */}
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">

          {/* ── LEGEND PANEL ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isLeftInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.6, delay: 0.5, ease: CINEMATIC_EASE }}
            className="shrink-0 w-full lg:w-56"
          >
            <p className="font-mono text-[8.5px] uppercase tracking-[0.38em] text-slate-700 mb-5">
              Reading the lineage
            </p>
            <div className="flex flex-col gap-4">
              {([0, 1, 2, 3] as const).map((gen) => {
                const c = GEN[gen];
                const labels = ["Archived root", "First generation", "Second generation", "Thriving descendant"];
                const descs  = [
                  "The original dead project",
                  "Directly inspired or forked",
                  "Built on first-gen ideas",
                  "Living and evolving today",
                ];
                return (
                  <div key={gen} className="flex items-start gap-2.5">
                    <div className="mt-1 size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: c.dot, boxShadow: `0 0 5px ${c.dot}66` }} />
                    <div>
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em]"
                        style={{ color: c.dot }}>{labels[gen]}</p>
                      <p className="text-[10px] text-slate-600 leading-snug mt-0.5">{descs[gen]}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hover hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={isGraphInView ? { opacity: 1 } : {}}
              transition={{ duration: 1.4, delay: 1, ease: CINEMATIC_EASE }}
              className="mt-10 font-mono text-[8px] uppercase tracking-[0.32em] text-slate-700"
            >
              Hover nodes to trace ancestry
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isLeftInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.5, delay: 0.85, ease: CINEMATIC_EASE }}
              className="mt-10"
            >
              <button
                className="group relative inline-flex items-center gap-2.5 border border-slate-700/50
                  bg-slate-900/40 px-6 py-3 font-mono text-[9.5px] uppercase tracking-[0.28em]
                  text-slate-400 backdrop-blur-sm transition-all duration-600
                  hover:border-blue-500/30 hover:bg-blue-950/25 hover:text-blue-300/90"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full
                  bg-gradient-to-r from-transparent via-blue-400/[0.04] to-transparent
                  transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Trace the Echo</span>
                <span className="relative transition-transform duration-400 group-hover:translate-x-1">→</span>
              </button>
            </motion.div>
          </motion.div>

          {/* ── LINEAGE GRAPH ── */}
          <motion.div
            ref={graphRef}
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={isGraphInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 1.8, ease: CINEMATIC_EASE }}
            className="relative w-full flex-1 min-h-[420px] md:min-h-[520px]"
          >
            {/* Graph backdrop glow */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background: "radial-gradient(ellipse at 48% 42%, rgba(59,130,246,0.04) 0%, rgba(75,85,99,0.03) 55%, transparent 80%)",
              }}
            />
            <LineageGraph revealed={revealed} />
          </motion.div>
        </div>

        {/* ── STATS ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={isGraphInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.8, delay: 0.7, ease: CINEMATIC_EASE }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-px border rounded-xl overflow-hidden"
          style={{ borderColor: "rgba(148,163,184,0.08)" }}
        >
          {[
            { val: "4,821", label: "Projects archived"    },
            { val: "1,204", label: "Lineage trees traced"  },
            { val: "892",   label: "Descendants born"      },
            { val: "317",   label: "Fully resurrected"     },
          ].map(({ val, label }) => (
            <div key={label}
              className="px-7 py-6 bg-[#050810]/60 hover:bg-[#080d18]/80 transition-colors duration-500">
              <div className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-slate-300/85">
                {val}
              </div>
              <div className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.30em] text-slate-700">
                {label}
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}