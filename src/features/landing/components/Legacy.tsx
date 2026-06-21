"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CINEMATIC_EASE } from "@/lib/utils/animation";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// constants

const BG_PARTICLES = [
  { left: "5%",  top: "12%", size: 1.4, color: "#e2e8f0", op: 0.07, dur: 14, delay: 0,   dy: -28 },
  { left: "18%", top: "68%", size: 1.0, color: "#fbbf24", op: 0.06, dur: 18, delay: 1.2, dy: -22 },
  { left: "28%", top: "28%", size: 1.2, color: "#e2e8f0", op: 0.06, dur: 12, delay: 2.8, dy: -35 },
  { left: "42%", top: "85%", size: 0.8, color: "#e2e8f0", op: 0.05, dur: 21, delay: 0.5, dy: -18 },
  { left: "55%", top: "8%",  size: 1.6, color: "#93c5fd", op: 0.08, dur: 16, delay: 4.0, dy: -30 },
  { left: "67%", top: "52%", size: 1.0, color: "#fbbf24", op: 0.05, dur: 19, delay: 2.1, dy: -25 },
  { left: "76%", top: "22%", size: 1.2, color: "#e2e8f0", op: 0.06, dur: 13, delay: 6.0, dy: -32 },
  { left: "88%", top: "75%", size: 0.9, color: "#93c5fd", op: 0.07, dur: 22, delay: 3.3, dy: -20 },
  { left: "11%", top: "45%", size: 1.0, color: "#e2e8f0", op: 0.05, dur: 17, delay: 1.7, dy: -28 },
  { left: "48%", top: "58%", size: 1.3, color: "#93c5fd", op: 0.06, dur: 15, delay: 5.2, dy: -24 },
  { left: "60%", top: "38%", size: 0.8, color: "#fbbf24", op: 0.05, dur: 20, delay: 7.0, dy: -30 },
  { left: "33%", top: "16%", size: 1.5, color: "#e2e8f0", op: 0.07, dur: 11, delay: 0.9, dy: -38 },
  { left: "72%", top: "88%", size: 0.7, color: "#e2e8f0", op: 0.04, dur: 24, delay: 3.8, dy: -16 },
  { left: "90%", top: "35%", size: 1.1, color: "#93c5fd", op: 0.06, dur: 16, delay: 2.5, dy: -26 },
  { left: "22%", top: "92%", size: 0.9, color: "#fbbf24", op: 0.04, dur: 23, delay: 5.8, dy: -18 },
  { left: "50%", top: "20%", size: 1.0, color: "#e2e8f0", op: 0.05, dur: 14, delay: 1.4, dy: -32 },
];

// idea fragments
const FRAGMENTS = [
  {
    text: "Calendar Logic",
    // top card
    top: "13%",
    left: "72%",
    mobileLeft: "55%",
    floatDy: -14,
    dur: 9,
    delay: 0,
    initDelay: 0.4,
    blur: 0,
    baseOp: 0.70,
  },
  {
    text: "Offline Sync",
    // mid point
    top: "46%",
    left: "8%",
    mobileLeft: "15%",
    floatDy: -10,
    dur: 11,
    delay: 2.5,
    initDelay: 1.0,
    blur: 1.5,
    baseOp: 0.52,
  },
  {
    text: "Focus-first UI",
    // bottom card
    top: "74%",
    left: "68%",
    mobileLeft: "50%",
    floatDy: -8,
    dur: 13,
    delay: 5.0,
    initDelay: 1.8,
    blur: 0,
    baseOp: 0.60,
  },
] as const;

interface IdeaFragmentProps {
  text: string;
  top: string;
  left: string;
  mobileLeft: string;
  floatDy: number;
  dur: number;
  delay: number;
  initDelay: number;
  blur: number;
  baseOp: number;
  visible: boolean;
  glowing: boolean;
}

// idea fragment
function IdeaFragment({
  text,
  top,
  left,
  floatDy,
  dur,
  delay,
  initDelay,
  blur,
  baseOp,
  visible,
  glowing,
}: IdeaFragmentProps) {
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ top, left, zIndex: 4 }}
      // fade in
      initial={{ opacity: 0, filter: `blur(${blur + 6}px)` }}
      animate={
        visible
          ? { opacity: 1, filter: `blur(${blur}px)` }
          : { opacity: 0, filter: `blur(${blur + 6}px)` }
      }
      transition={{ duration: 2.4, delay: initDelay, ease: CINEMATIC_EASE }}
    >
      {/* floating loop - CSS, zero JS RAF */}
      <div
        style={{
          ["--lf-dy" as string]: `${floatDy}px`,
          ["--lf-op" as string]: String(baseOp),
          ["--lf-op2" as string]: String(baseOp * 0.55),
          animation: `lf-float ${dur}s ease-in-out ${delay}s infinite`,
          willChange: "transform, opacity",
        }}
      >
        <style suppressHydrationWarning>{`
          @keyframes lf-float {
            0%,100% { transform:translateY(0);              opacity:var(--lf-op);  }
            50%      { transform:translateY(var(--lf-dy));   opacity:var(--lf-op2); }
          }
        `}</style>
        {/* outer glow */}
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{ opacity: glowing ? 1 : 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{
            background: "rgba(251,191,36,0.08)",
            filter: "blur(10px)",
            transform: "scale(1.8)",
          }}
        />

        {/* chip - uses opacity-only transitions (GPU composited, no paint) */}
        <span
          className="relative block whitespace-nowrap rounded-full font-mono text-[10px] uppercase tracking-[0.28em] backdrop-blur-md"
          style={{
            padding: "5px 14px",
            color: "rgba(251,191,36,0.90)",
            borderColor: "rgba(251,191,36,0.32)",
            background: "rgba(180,83,9,0.16)",
            transition: "opacity 0.7s ease",
            opacity: glowing ? 1 : 0.65,
          }}
        >
          {/* glow overlay - fades via GPU-composited opacity */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              boxShadow: "0 0 20px rgba(251,191,36,0.18), 0 0 6px rgba(251,191,36,0.10) inset",
              opacity: glowing ? 1 : 0,
              transition: "opacity 0.7s ease",
            }}
          />
          <span style={{ border: "1px solid", borderColor: "inherit", position: "absolute", inset: 0, borderRadius: "9999px" }} />
          {text}
        </span>
      </div>
    </motion.div>
  );
}

// dead card
function DeadCard({ visible }: { visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      animate={visible ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 2.6, ease: CINEMATIC_EASE }}
      className="relative w-full max-w-[300px]"
      style={{ zIndex: 2 }}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-3xl"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 60%, rgba(180,83,9,0.10) 0%, transparent 70%)",
          filter: "blur(24px)",
        }}
      />
      <div
        className="pointer-events-none absolute -inset-4 rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(120,60,20,0.08) 0%, transparent 65%)",
          filter: "blur(12px)",
        }}
      />
      <div
        className="relative rounded-2xl p-6 backdrop-blur-md"
        style={{
          background: "linear-gradient(145deg, rgba(14,10,8,0.85) 0%, rgba(10,8,6,0.90) 100%)",
          border: "1px solid rgba(140,100,60,0.18)",
          boxShadow: "0 0 0 1px rgba(140,100,60,0.06) inset, 0 12px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.03]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="mb-4 flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-amber-900/70" />
          <span className="font-mono text-[10px] uppercase tracking-[0.45em]" style={{ color: "rgba(180,120,60,0.50)" }}>
            Archived · 2024
          </span>
        </div>
        <h3 className="mb-2 font-mono text-xl font-semibold tracking-tight" style={{ color: "rgba(255,255,255,0.38)" }}>
          TaskBridge
        </h3>
        <p className="font-mono text-[12px] italic leading-[1.8]" style={{ color: "rgba(255,255,255,0.22)" }}>
          "Realtime sync failed.
          <br />
          Couldn't keep up."
        </p>
        <div
          className="mt-5 h-px w-full"
          style={{ background: "linear-gradient(to right, transparent, rgba(180,120,60,0.35), transparent)" }}
        />
        <p className="mt-3.5 font-mono text-[10px] uppercase tracking-[0.38em]" style={{ color: "rgba(255,255,255,0.14)" }}>
          Last commit · Feb 28, 2024
        </p>
      </div>
    </motion.div>
  );
}

// transfer line
function TransferLine({ visible, hovered }: { visible: boolean; hovered: boolean }) {
  const pathRef  = useRef<SVGPathElement>(null);
  const glowRef  = useRef<SVGPathElement>(null);
  const glowRef2 = useRef<SVGPathElement>(null);
  const pulseRef = useRef<SVGPathElement>(null);

  const PATH = "M 100 10 C 100 80 55 140 100 200 C 145 240 100 252 100 252";

  useEffect(() => {
    const path  = pathRef.current;
    const glow  = glowRef.current;
    const glow2 = glowRef2.current;
    if (!path || !glow || !glow2) return;

    // Path length hardcoded to avoid getTotalLength() forced reflow.
    // Measured from: M 100 10 C 100 80 55 140 100 200 C 145 240 100 252 100 252
    const len = 310;
    [path, glow, glow2].forEach((el) => {
      el.style.strokeDasharray  = String(len);
      el.style.strokeDashoffset = String(len);
    });

    if (visible) {
      gsap.to([path, glow, glow2], {
        strokeDashoffset: 0,
        duration: 3.2,
        ease: "power2.inOut",
        delay: 0.3,
      });
      // glow pulse
      gsap.to(glow, {
        opacity: 0.08,
        duration: 2.5,
        delay: 3.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
  }, [visible]);

  // hover effect
  useEffect(() => {
    if (!glowRef.current) return;
    gsap.to(glowRef.current, {
      opacity: hovered ? 0.28 : 0.12,
      duration: 0.6,
      ease: "power2.out",
    });
  }, [hovered]);

  return (
    <svg viewBox="0 0 200 262" className="w-full h-full" style={{ overflow: "visible" }} aria-hidden>
      <defs>
        <linearGradient id="lg-line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#b45309" stopOpacity="0.55" />
          <stop offset="55%"  stopColor="#3b82f6" stopOpacity="0.50" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.60" />
        </linearGradient>
        <linearGradient id="lg-glow-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="55%"  stopColor="#60a5fa" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.9" />
        </linearGradient>
        <filter id="lg-path-glow" x="-80%" y="-20%" width="260%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="lg-particle-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* wide halo */}
      <path ref={glowRef2} d={PATH} fill="none" stroke="url(#lg-glow-grad)"
        strokeWidth="14" strokeLinecap="round" opacity="0.04" filter="url(#lg-path-glow)" />

      {/* mid glow */}
      <path ref={glowRef} d={PATH} fill="none" stroke="url(#lg-glow-grad)"
        strokeWidth="5" strokeLinecap="round" opacity="0.12" filter="url(#lg-path-glow)" />

      {/* hover pulse */}
      {hovered && (
        <path ref={pulseRef} d={PATH} fill="none" stroke="url(#lg-glow-grad)"
          strokeWidth="3" strokeLinecap="round" opacity="0.35" filter="url(#lg-path-glow)">
          <animate attributeName="opacity" values="0.15;0.45;0.15" dur="1.4s" repeatCount="indefinite" />
        </path>
      )}

      {/* core line */}
      <path ref={pathRef} d={PATH} fill="none" stroke="url(#lg-line-grad)"
        strokeWidth="1.0" strokeLinecap="round"
        opacity={visible ? 0.75 : 0} style={{ transition: "opacity 0.6s" }} />

      {/* particles */}
      {visible && (
        <>
          <circle r="2" fill="#fbbf24" opacity="0.85" filter="url(#lg-particle-glow)">
            <animateMotion dur="4.2s" begin="0.6s" repeatCount="indefinite" path={PATH} />
            <animate attributeName="opacity" values="0;0;0.85;0.85;0" dur="4.2s" begin="0.6s" repeatCount="indefinite" />
          </circle>
          <circle r="1.6" fill="#93c5fd" opacity="0.80" filter="url(#lg-particle-glow)">
            <animateMotion dur="4.2s" begin="1.9s" repeatCount="indefinite" path={PATH} />
            <animate attributeName="opacity" values="0;0;0.80;0.80;0" dur="4.2s" begin="1.9s" repeatCount="indefinite" />
          </circle>
          <circle r="1.2" fill="#bfdbfe" opacity="0.70" filter="url(#lg-particle-glow)">
            <animateMotion dur="4.2s" begin="3.3s" repeatCount="indefinite" path={PATH} />
            <animate attributeName="opacity" values="0;0;0.70;0.70;0" dur="4.2s" begin="3.3s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

// revived card
function RevivedCard({
  visible,
  onHover,
}: {
  visible: boolean;
  onHover: (v: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
      animate={visible ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 3.0, delay: 0.3, ease: CINEMATIC_EASE }}
      className="relative w-full max-w-[300px] cursor-default"
      style={{ zIndex: 2 }}
      onHoverStart={() => onHover(true)}
      onHoverEnd={() => onHover(false)}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-3xl"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(59,130,246,0.10) 0%, transparent 70%)",
          filter: "blur(28px)",
        }}
      />
      <div
        className="pointer-events-none absolute -inset-4 rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(30,80,180,0.08) 0%, transparent 65%)",
          filter: "blur(14px)",
        }}
      />
      <div
        className="relative rounded-2xl p-6 backdrop-blur-md"
        style={{
          background: "linear-gradient(145deg, rgba(8,16,30,0.88) 0%, rgba(6,12,24,0.92) 100%)",
          border: "1px solid rgba(59,130,246,0.25)",
          boxShadow: "0 0 0 1px rgba(59,130,246,0.07) inset, 0 12px 48px rgba(0,0,0,0.7), 0 2px 12px rgba(30,80,180,0.12)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.03]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="mb-4 flex items-center gap-2.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: "#60a5fa",
              boxShadow: "0 0 8px rgba(96,165,250,0.5)",
              animation: "lg-dot-blue 2.8s ease-in-out infinite",
              willChange: "transform, opacity",
            }}
          >
            <style suppressHydrationWarning>{`@keyframes lg-dot-blue{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.25;transform:scale(1.3)}}`}</style>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.45em]" style={{ color: "rgba(96,165,250,0.60)" }}>
            Revived · 2027
          </span>
        </div>
        <h3 className="mb-2 font-mono text-xl font-semibold tracking-tight" style={{ color: "rgba(255,255,255,0.78)" }}>
          FlowState
        </h3>
        <p className="font-mono text-[12px] italic leading-[1.8]" style={{ color: "rgba(255,255,255,0.38)" }}>
          "Inspired by TaskBridge.
          <br />
          Built to finish what it started."
        </p>
        <div
          className="mt-5 h-px w-full"
          style={{ background: "linear-gradient(to right, transparent, rgba(96,165,250,0.45), transparent)" }}
        />
        <p className="mt-3.5 font-mono text-[10px] uppercase tracking-[0.38em]" style={{ color: "rgba(255,255,255,0.22)" }}>
          Inherited 4 core ideas
        </p>
      </div>
    </motion.div>
  );
}

// future node
function FutureNode({ visible }: { visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, filter: "blur(18px)" }}
      animate={visible ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
      transition={{ duration: 3.2, delay: 0.8, ease: CINEMATIC_EASE }}
      className="relative"
      style={{ zIndex: 2 }}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-full"
        style={{
          background: "radial-gradient(ellipse at center, rgba(148,163,184,0.10) 0%, transparent 70%)",
          filter: "blur(28px)",
        }}
      />
      <div
        className="relative rounded-2xl px-7 py-5 backdrop-blur-md"
        style={{
          background: "linear-gradient(145deg, rgba(10,14,26,0.80) 0%, rgba(8,12,22,0.85) 100%)",
          border: "1px solid rgba(148,163,184,0.20)",
          boxShadow: "0 0 0 1px rgba(148,163,184,0.06) inset, 0 16px 56px rgba(0,0,0,0.55)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: "#94a3b8",
              boxShadow: "0 0 10px rgba(148,163,184,0.5)",
              animation: "lg-dot-slate 4.0s ease-in-out infinite",
              willChange: "transform, opacity",
            }}
          >
            <style suppressHydrationWarning>{`@keyframes lg-dot-slate{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(1.5)}}`}</style>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.45em]" style={{ color: "rgba(148,163,184,0.55)" }}>
            Living · 2030
          </span>
        </div>
        <p className="mt-2.5 font-mono text-base font-semibold tracking-tight" style={{ color: "rgba(255,255,255,0.62)" }}>
          FlowState OS
        </p>
        <p className="mt-1 font-mono text-[11px] italic" style={{ color: "rgba(255,255,255,0.28)" }}>
          The idea fully evolved.
        </p>
      </div>
    </motion.div>
  );
}

// left narrative
function LeftNarrative({ inView }: { inView: boolean }) {
  return (
    <div className="flex flex-col justify-center gap-10 lg:gap-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 1.8, ease: CINEMATIC_EASE }}
        className="flex items-center gap-4"
      >
        <span className="h-px w-10 bg-slate-700/70" />
        <span className="font-mono text-[10px] uppercase tracking-[0.55em] text-slate-600">Legacy</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
        animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 2.4, delay: 0.15, ease: CINEMATIC_EASE }}
      >
        <h2
          className="text-balance font-sans text-4xl font-extrabold leading-[1.06] tracking-[-0.035em] md:text-5xl lg:text-[3.6rem]"
          style={{ color: "rgba(226,232,240,0.88)" }}
        >
          Some ideas
          <br />
          <span className="font-light italic" style={{ color: "rgba(148,163,184,0.48)" }}>never really</span>
          <br />
          disappear.
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 2.2, delay: 0.4, ease: CINEMATIC_EASE }}
        className="max-w-sm"
      >
        <p className="text-base leading-[1.85] tracking-wide" style={{ color: "rgba(148,163,184,0.52)" }}>
          Archived projects leave behind architecture, concepts, and unfinished
          thinking - waiting for the next builder willing to continue them.
        </p>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 2.2, delay: 0.75, ease: CINEMATIC_EASE }}
        className="h-px w-28 origin-left"
        style={{ background: "linear-gradient(to right, rgba(148,163,184,0.18), transparent)" }}
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 3.0, delay: 1.1, ease: CINEMATIC_EASE }}
        className="font-mono text-[12px] italic tracking-[0.20em]"
        style={{ color: "rgba(148,163,184,0.32)" }}
      >
        The builder stopped. The idea didn't.
      </motion.p>
    </div>
  );
}

// main section
export function Legacy() {
  const sectionRef  = useRef<HTMLElement>(null);
  const leftRef     = useRef<HTMLDivElement>(null);
  const visualRef   = useRef<HTMLDivElement>(null);
  const epilogueRef = useRef<HTMLDivElement>(null);

  // hover state
  const [revivedHovered, setRevivedHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const leftInView     = useInView(leftRef,     { once: true, margin: "-100px" });
  const visualInView   = useInView(visualRef,   { once: true, margin: "-80px"  });
  const epilogueInView = useInView(epilogueRef, { once: true, margin: "-60px"  });

  // parallax
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      gsap.to(".lg-visual-inner", {
        y: -24,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="legacy"
      className="relative overflow-hidden"
      style={{ background: "#060810" }}
    >
      {/* top fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 z-10"
        style={{ background: "linear-gradient(to bottom, #030508 0%, transparent 100%)" }}
      />

      {/* background - CSS-only animations, zero JS RAF cost */}
      <div className="pointer-events-none absolute inset-0">
        <style>{`
          @keyframes lg-glow-pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50%       { opacity: 1.0; transform: scale(1.06); }
          }
          @keyframes lg-amber-pulse {
            0%, 100% { opacity: 0.5; }
            50%       { opacity: 0.9; }
          }
          @keyframes lg-drift-a {
            0%, 100% { transform: translate(0, 0); }
            50%       { transform: translate(18px, -12px); }
          }
          @keyframes lg-drift-b {
            0%, 100% { transform: translate(0, 0); }
            50%       { transform: translate(-14px, 10px); }
          }
          @keyframes lg-particle {
            0%   { transform: translateY(0);              opacity: 0; }
            20%  { opacity: var(--lg-op); }
            80%  { opacity: var(--lg-op); }
            100% { transform: translateY(var(--lg-dy));   opacity: 0; }
          }
        `}</style>

        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 90% 65% at 60% 46%, #081020 0%, #060810 60%, #030508 100%)" }}
        />

        {/* blue glow pulse */}
        <div
          className="absolute"
          style={{
            left: "52%", top: "32%", width: 700, height: 580,
            transform: "translate(-50%,-50%)",
            animation: "lg-glow-pulse 12s ease-in-out infinite",
            willChange: "transform, opacity",
          }}
        >
          <div className="w-full h-full"
            style={{ background: "radial-gradient(ellipse at center, rgba(59,130,246,0.035) 0%, transparent 65%)" }}
          />
        </div>

        {/* static deep-right glow */}
        <div className="absolute"
          style={{
            left: "70%", top: "60%", width: 500, height: 400,
            transform: "translate(-50%,-50%)",
            background: "radial-gradient(ellipse at center, rgba(30,58,138,0.025) 0%, transparent 65%)",
          }}
        />

        {/* amber top-left pulse */}
        <div
          className="absolute"
          style={{
            left: "8%", top: "5%", width: 450, height: 320,
            animation: "lg-amber-pulse 16s ease-in-out 2s infinite",
            willChange: "opacity",
          }}
        >
          <div className="w-full h-full"
            style={{ background: "radial-gradient(ellipse at center, rgba(180,83,9,0.05) 0%, transparent 70%)", filter: "blur(40px)" }}
          />
        </div>

        {/* drift A */}
        <div className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 30% 70%, rgba(8,16,32,0.25) 0%, transparent 70%)",
            animation: "lg-drift-a 28s ease-in-out infinite",
            willChange: "transform",
          }}
        />

        {/* drift B */}
        <div className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 50% 35% at 70% 25%, rgba(8,16,32,0.20) 0%, transparent 65%)",
            animation: "lg-drift-b 22s ease-in-out 6s infinite",
            willChange: "transform",
          }}
        />

        {/* bg particles - CSS custom props per particle */}
        {BG_PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              left: p.left, top: p.top,
              width: p.size, height: p.size,
              backgroundColor: p.color,
              ["--lg-dy" as string]: `${p.dy}px`,
              ["--lg-op" as string]: String(p.op),
              animation: `lg-particle ${p.dur}s ease-in-out ${p.delay}s infinite`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>


      {/* main content */}
      <div className="relative mx-auto max-w-7xl px-6 py-28 md:py-40 md:px-10">
        <div className="flex flex-col gap-20 lg:flex-row lg:gap-24 lg:items-center">

          {/* left narrative */}
          <div ref={leftRef} className="lg:w-[44%] lg:shrink-0">
            <LeftNarrative inView={leftInView} />
          </div>

          {/* right visual — single layout, chips hidden on mobile via lg:block */}
          <div
            ref={visualRef}
            className="relative flex-1 flex flex-col items-center gap-0"
            style={{ minHeight: 600 }}
          >
            <div className="lg-visual-inner relative flex flex-col items-center w-full" style={{ minHeight: 600 }}>

              {/* volumetric fog */}
              <div
                className="pointer-events-none absolute -inset-12 rounded-3xl"
                style={{
                  background: "radial-gradient(ellipse at 48% 45%, rgba(8,16,34,0.7) 0%, transparent 70%)",
                  filter: "blur(8px)",
                }}
              />

              {/* fragments — hidden on mobile (absolute chips overflow small screens) */}
              <div className="hidden lg:block">
                {FRAGMENTS.map((f) => (
                  <IdeaFragment
                    key={f.text}
                    {...f}
                    left={f.left}
                    visible={visualInView}
                    glowing={revivedHovered}
                  />
                ))}
              </div>

              {/* dead card */}
              <DeadCard visible={visualInView} />

              {/* connector */}
              <div className="relative flex flex-col items-center w-full" style={{ height: 210 }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div style={{ width: 140, height: 210 }}>
                    <TransferLine visible={visualInView} hovered={revivedHovered} />
                  </div>
                </div>
              </div>

              {/* revived card */}
              <RevivedCard visible={visualInView} onHover={setRevivedHovered} />

              {/* future connector */}
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={visualInView ? { opacity: 1, scaleY: 1 } : {}}
                transition={{ duration: 2.0, delay: 2.0, ease: CINEMATIC_EASE }}
                className="origin-top mt-2"
                style={{
                  width: 1,
                  height: 56,
                  background: "linear-gradient(to bottom, rgba(148,163,184,0.28), transparent)",
                }}
              />

              {/* future node */}
              <FutureNode visible={visualInView} />
            </div>
          </div>
        </div>

        {/* epilogue */}
        <div ref={epilogueRef} className="mt-36 md:mt-48 flex flex-col items-center text-center">
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={epilogueInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 2.2, ease: CINEMATIC_EASE }}
            className="mb-14 h-px w-40 origin-center"
            style={{ background: "linear-gradient(to right, transparent, rgba(148,163,184,0.25), transparent)" }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={epilogueInView ? { opacity: 1 } : {}}
            transition={{ duration: 1.4, ease: CINEMATIC_EASE }}
            className="mb-8 font-mono text-[10px] uppercase tracking-[0.55em]"
            style={{ color: "rgba(148,163,184,0.30)" }}
          >
            The nature of ideas
          </motion.p>

          <motion.blockquote
            initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
            animate={epilogueInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 3.0, delay: 0.25, ease: CINEMATIC_EASE }}
            className="max-w-2xl text-[1.6rem] font-light italic leading-[1.65] tracking-tight md:text-[2rem]"
            style={{ color: "rgba(226,232,240,0.62)" }}
          >
            Projects may die.
            <br />
            Builders may leave.
            <br />
            <span className="not-italic font-normal" style={{ color: "rgba(226,232,240,0.85)" }}>
              But strong ideas find another person
              <br />
              willing to continue them.
            </span>
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={epilogueInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 3.2, delay: 1.0, ease: CINEMATIC_EASE }}
            className="mt-20 flex flex-col items-center gap-4"
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: "#fbbf24",
                boxShadow: "0 0 12px rgba(251,191,36,0.50), 0 0 4px rgba(251,191,36,0.30)",
                animation: "lg-dot-amber 4s ease-in-out infinite",
                willChange: "transform, opacity",
              }}
            >
              <style suppressHydrationWarning>{`@keyframes lg-dot-amber{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}`}</style>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.45em]" style={{ color: "rgba(148,163,184,0.20)" }}>
              The idea survives
            </p>
          </motion.div>
        </div>
      </div>

      {/* bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 z-10"
        style={{ background: "linear-gradient(to top, #0a0a0f 0%, transparent 100%)" }}
      />
    </section>
  );
}
