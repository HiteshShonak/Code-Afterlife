"use client";

import { useRef, useEffect, useState } from "react";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
} from "framer-motion";
import { CINEMATIC_EASE } from "@/lib/utils/animation";

// types

// phase type
type ObservatoryPhase = 0 | 1 | 2;

// scroll reveal type
type ScrollRevealPhase = 1 | 2;

// waveform key type
type WFKey = "dormant" | "waking" | "alive";

// transmission interface
interface TransmissionConfig {
  readonly text: string;
  readonly sz: number;           // font-size in px
  readonly op: number;           // max opacity (0–1)
  readonly blur: number;         // depth blur in px (0 = sharp)
  readonly dur: number;          // float animation duration in seconds
  readonly delay: number;        // float animation delay in seconds
  readonly dy: number;           // vertical drift offset in px
  readonly dx: number;           // horizontal drift offset in px
  readonly x: string;            // CSS left position (e.g. "12%")
  readonly y: string;            // CSS top position (e.g. "58%")
  readonly scrollReveal: ScrollRevealPhase;
}

// particle interface
interface ParticleConfig {
  readonly l: string;    // CSS left
  readonly t: string;    // CSS top
  readonly s: number;    // size in px
  readonly op: number;   // max opacity
  readonly dur: number;  // animation duration in seconds
  readonly dl: number;   // animation delay in seconds
  readonly rise: number; // y-rise distance in px
  readonly warm: boolean; // amber warm (true) vs cold grey (false)
}

// phase props
interface PhaseProps {
  phase: ObservatoryPhase;
}

// floating transmission props
interface FloatingTransmissionProps extends TransmissionConfig {
  phase: ObservatoryPhase;
}

// left typography props
interface LeftTypographyProps {
  inView: boolean;
}

const WF: Record<WFKey, string> = {
  // dormant
  dormant:
    "M0,25 C18,25 32,25 50,25 C68,25 82,25 100,25 C118,25 132,25 150,25 C168,25 182,25 200,25 C218,25 232,25 250,25 C268,25 282,25 300,25",
  // waking
  waking:
    "M0,25 C14,21 30,22 50,25 C71,28 83,31 100,25 C115,19 131,21 150,25 C170,29 184,30 200,25 C216,21 233,22 250,25 C269,28 283,29 300,25",
  // alive
  alive:
    "M0,25 C16,10 31,10 50,25 C70,40 84,41 100,25 C117,10 130,9 150,25 C171,41 185,40 200,25 C217,10 232,11 250,25 C271,40 284,39 300,25",
};

// floating transmissions
// Carefully designed for organic scatter - varying size, opacity, blur, timing.
// scrollReveal: which scroll phase triggers appearance (1 = early, 2 = later)
const TRANSMISSIONS: readonly TransmissionConfig[] = [
  // human signal
  {
    text: "someone is still listening",
    sz: 10,    op: 0.28, blur: 0.4, dur: 26, delay: 0,   dy: -11, dx: 3,
    x: "12%", y: "58%", scrollReveal: 1,
  },
  // bright signal
  {
    text: "revival signal detected",
    sz: 11.5,  op: 0.55, blur: 0,   dur: 20, delay: 1.4, dy: -19, dx: 0,
    x: "68%", y: "16%", scrollReveal: 1,
  },
  // faint signal
  {
    text: "archive movement observed",
    sz: 9.5,   op: 0.22, blur: 0.8, dur: 28, delay: 4.2, dy: -14, dx: -4,
    x: "82%", y: "72%", scrollReveal: 2,
  },
  // medium signal
  {
    text: "afterlife ai observing",
    sz: 10,    op: 0.35, blur: 0.2, dur: 18, delay: 2.8, dy: -17, dx: 0,
    x: "6%",  y: "34%", scrollReveal: 1,
  },
  // deep background
  {
    text: "fork activity detected",
    sz: 9,     op: 0.18, blur: 1.2, dur: 32, delay: 6.0, dy: -9,  dx: 2,
    x: "56%", y: "88%", scrollReveal: 2,
  },
  // medium
  {
    text: "dormant project reacting",
    sz: 10.5,  op: 0.32, blur: 0,   dur: 22, delay: 3.6, dy: -22, dx: -2,
    x: "24%", y: "80%", scrollReveal: 2,
  },
  // closer
  {
    text: "weak pulse recovered",
    sz: 11,    op: 0.42, blur: 0,   dur: 17, delay: 0.8, dy: -16, dx: 0,
    x: "76%", y: "40%", scrollReveal: 1,
  },
  // distant whisper
  {
    text: "contributor echo detected",
    sz: 9,     op: 0.20, blur: 1.0, dur: 24, delay: 8.5, dy: -10, dx: 3,
    x: "44%", y: "6%",  scrollReveal: 2,
  },
  // buried low
  {
    text: "signal stability increasing",
    sz: 10,    op: 0.26, blur: 0.3, dur: 30, delay: 5.5, dy: -13, dx: 0,
    x: "4%",  y: "72%", scrollReveal: 2,
  },
  // clear human metric
  {
    text: "482 builders responding to signal",
    sz: 10,    op: 0.34, blur: 0,   dur: 19, delay: 2.2, dy: -18, dx: -3,
    x: "62%", y: "54%", scrollReveal: 1,
  },
  // final faint
  {
    text: "resurrection momentum increasing",
    sz: 9.5,   op: 0.20, blur: 0.6, dur: 25, delay: 9.5, dy: -12, dx: 1,
    x: "80%", y: "86%", scrollReveal: 2,
  },
  // tiny edge
  {
    text: "a new contributor appeared",
    sz: 9,     op: 0.24, blur: 0.5, dur: 21, delay: 7.0, dy: -10, dx: -2,
    x: "32%", y: "14%", scrollReveal: 2,
  },
];

// ai whispers
const WHISPERS = [
  "architecture integrity remains stable",
  "community resonance detected",
  "branch activity weakening",
  "unfinished deployment sequence observed",
  "core systems remain recoverable",
  "revival probability - rising",
  "last signal: 12 days ago",
  "fork momentum detected in archive",
  "3 watchers remain active",
  "core still intact after dormancy",
];

// ambient particles
// Kept lean - 16 particles, deterministic positions, GPU-only (opacity + transform)
const PARTICLES: readonly ParticleConfig[] = [
  { l:"7%",  t:"11%", s:1.0, op:0.038, dur:16, dl:0.0, rise:28, warm:false },
  { l:"18%", t:"67%", s:0.7, op:0.028, dur:22, dl:3.1, rise:18, warm:true  },
  { l:"31%", t:"42%", s:0.9, op:0.032, dur:14, dl:6.4, rise:24, warm:false },
  { l:"44%", t:"81%", s:0.7, op:0.025, dur:19, dl:1.8, rise:16, warm:false },
  { l:"55%", t:"23%", s:1.1, op:0.042, dur:18, dl:8.2, rise:32, warm:false },
  { l:"62%", t:"76%", s:0.8, op:0.030, dur:25, dl:4.5, rise:20, warm:true  },
  { l:"73%", t:"14%", s:0.9, op:0.036, dur:13, dl:2.0, rise:26, warm:false },
  { l:"82%", t:"54%", s:1.0, op:0.028, dur:21, dl:7.3, rise:22, warm:false },
  { l:"91%", t:"38%", s:0.7, op:0.022, dur:17, dl:5.1, rise:16, warm:false },
  { l:"26%", t:"28%", s:1.2, op:0.040, dur:20, dl:0.7, rise:30, warm:true  },
  { l:"48%", t:"62%", s:0.8, op:0.026, dur:23, dl:9.0, rise:18, warm:false },
  { l:"86%", t:"79%", s:0.9, op:0.032, dur:15, dl:3.8, rise:24, warm:false },
  { l:"14%", t:"88%", s:1.0, op:0.028, dur:26, dl:1.4, rise:20, warm:false },
  { l:"67%", t:"35%", s:0.8, op:0.034, dur:12, dl:6.8, rise:28, warm:true  },
  { l:"38%", t:"7%",  s:0.7, op:0.024, dur:18, dl:4.2, rise:14, warm:false },
  { l:"76%", t:"92%", s:1.1, op:0.036, dur:20, dl:2.9, rise:22, warm:false },
];

// keyframes
// All ring animations are CSS-driven (no JS RAF) - GPU composited, zero CPU cost
const KEYFRAMES = `
  @keyframes obs-ring-a { to { transform: rotate(360deg);  } }
  @keyframes obs-ring-b { to { transform: rotate(-360deg); } }
  @keyframes obs-ring-c { to { transform: rotate(360deg);  } }
  @keyframes obs-sweep  { to { transform: rotate(360deg);  } }
  @keyframes obs-flicker {
    0%,100% { opacity: 0.85; }
    28%     { opacity: 0.70; }
    42%     { opacity: 0.90; }
    67%     { opacity: 0.62; }
    81%     { opacity: 0.88; }
  }
  @keyframes ft-drift {
    0%   { transform: translate(0, 0); }
    50%  { transform: translate(var(--ft-dx), var(--ft-dy)); }
    100% { transform: translate(0, 0); }
  }
  .obs-ring-a {
    animation: obs-ring-a 52s linear infinite;
    transform-origin: 200px 200px;
  }
  .obs-ring-b {
    animation: obs-ring-b 78s linear infinite;
    transform-origin: 200px 200px;
  }
  .obs-ring-c {
    animation: obs-ring-c 96s linear infinite;
    transform-origin: 200px 200px;
  }
  .obs-sweep {
    animation: obs-sweep 32s linear infinite;
    transform-origin: 200px 200px;
  }
  .obs-core-flicker {
    animation: obs-flicker 11s ease-in-out infinite;
  }
`;

// observatory orb
function ObservatoryOrb({ phase }: PhaseProps) {
  const CYAN = "#38bdf8";

  // transition values
  const ringOp   = phase === 0 ? 0.05 : phase === 1 ? 0.15 : 0.26;
  const coreOp   = phase === 0 ? 0.10 : phase === 1 ? 0.42 : 0.78;
  const sweepOp  = phase === 0 ? 0.00 : phase === 1 ? 0.09 : 0.16;
  const pulseDur = phase === 0 ? 11   : phase === 1 ? 7.5  : 5.2;
  const glowCol  = phase === 0
    ? "rgba(56,189,248,0.018)"
    : phase === 1
    ? "rgba(56,189,248,0.048)"
    : "rgba(56,189,248,0.11)";

  return (
    <>
      <style suppressHydrationWarning>{KEYFRAMES}</style>

      {/* outer halo */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ inset: -40, filter: "blur(55px)", zIndex: 0 }}
        animate={{ background: `radial-gradient(ellipse at center, ${glowCol} 0%, transparent 62%)` }}
        transition={{ duration: 4.0, ease: "easeInOut" }}
      />

      {/* inner halo */}
      <motion.div
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "20%",
          filter: "blur(28px)",
          zIndex: 0,
        }}
        animate={{
          background: `radial-gradient(ellipse at center, ${glowCol.replace("0.018","0.032").replace("0.048","0.08").replace("0.11","0.18")} 0%, transparent 70%)`,
          opacity: phase === 0 ? [0.3, 0.1, 0.3] : [0.8, 0.5, 0.8],
        }}
        transition={{
          background: { duration: 4.0 },
          opacity: { duration: pulseDur * 0.9, repeat: Infinity, ease: "easeInOut" },
        }}
      />

      <svg
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        style={{ overflow: "visible", maxWidth: 400, maxHeight: 400, position: "relative", zIndex: 1 }}
        aria-hidden
      >
        <defs>
          {/* soft glow */}
          <filter id="obs-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* heavier glow */}
          <filter id="obs-softglow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* core gradient */}
          <radialGradient id="obs-core-grad" cx="50%" cy="42%" r="50%">
            <stop offset="0%"   stopColor={CYAN} stopOpacity={coreOp} />
            <stop offset="38%"  stopColor={CYAN} stopOpacity={coreOp * 0.28} />
            <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
          </radialGradient>
          {/* offset core */}
          <radialGradient id="obs-core-2" cx="56%" cy="56%" r="50%">
            <stop offset="0%"   stopColor={CYAN} stopOpacity={coreOp * 0.35} />
            <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ring a */}
        <motion.circle
          className="obs-ring-a"
          cx="200" cy="200" r="182"
          fill="none"
          strokeDasharray="5 26"
          strokeWidth="0.65"
          stroke={CYAN}
          initial={{ opacity: 0 }}
          animate={{ opacity: ringOp * 0.65 }}
          transition={{ duration: 3.0 }}
        />

        {/* ring b */}
        <motion.circle
          className="obs-ring-b"
          cx="200" cy="200" r="150"
          fill="none"
          strokeDasharray="2 20"
          strokeWidth="0.55"
          stroke={CYAN}
          initial={{ opacity: 0 }}
          animate={{ opacity: ringOp * 0.80 }}
          transition={{ duration: 3.0 }}
        />

        {/* ring c */}
        <motion.circle
          className="obs-ring-c"
          cx="200" cy="200" r="118"
          fill="none"
          strokeDasharray="1 13"
          strokeWidth="0.50"
          stroke={CYAN}
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === 0 ? 0.04 : [ringOp, ringOp * 0.40, ringOp],
          }}
          transition={{
            opacity: {
              duration: pulseDur * 1.3,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />

        {/* inner ring */}
        <motion.circle
          cx="200" cy="200" r="84"
          fill="none"
          strokeWidth="0.75"
          stroke={CYAN}
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === 0 ? 0.05 : [ringOp * 1.15, ringOp * 0.44, ringOp * 1.15],
          }}
          transition={{
            opacity: {
              duration: pulseDur,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />

        {/* radar sweep */}
        {phase > 0 && (
          <motion.line
            className="obs-sweep"
            x1="200" y1="200" x2="200" y2="28"
            stroke={CYAN}
            strokeWidth="0.85"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: sweepOp }}
            transition={{ duration: 3.5, ease: CINEMATIC_EASE }}
          />
        )}

        {/* cardinal nodes */}
        {[0, 90, 180, 270].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const cx2 = +(200 + Math.cos(rad) * 84).toFixed(1);
          const cy2 = +(200 + Math.sin(rad) * 84).toFixed(1);
          return (
            <motion.circle
              key={i}
              cx={cx2} cy={cy2} r="2.0"
              filter="url(#obs-glow)"
              fill={CYAN}
              initial={{ opacity: 0 }}
              animate={{
                opacity: phase === 0 ? 0.06 : [ringOp * 2.1, ringOp * 0.75, ringOp * 2.1],
              }}
              transition={{
                opacity: {
                  duration: pulseDur * 0.88,
                  repeat: Infinity,
                  delay: i * 0.55,
                  ease: "easeInOut",
                },
              }}
            />
          );
        })}

        {/* tick marks */}
        {[38, 142, 218, 322].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = +(200 + Math.cos(rad) * 90).toFixed(1);
          const y1 = +(200 + Math.sin(rad) * 90).toFixed(1);
          const x2 = +(200 + Math.cos(rad) * 110).toFixed(1);
          const y2 = +(200 + Math.sin(rad) * 110).toFixed(1);
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              strokeWidth="0.45"
              stroke={CYAN}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 0 ? 0.02 : ringOp * 0.75 }}
              transition={{ duration: 3.0, delay: i * 0.12 }}
            />
          );
        })}

        {/* core fill */}
        <motion.circle
          cx="200" cy="200" r="72"
          fill="url(#obs-core-grad)"
          filter="url(#obs-softglow)"
          className="obs-core-flicker"
          animate={{
            opacity: phase === 0
              ? [0.12, 0.05, 0.12]
              : phase === 1
              ? [0.52, 0.28, 0.52]
              : [1.0, 0.60, 1.0],
          }}
          transition={{
            opacity: {
              duration: pulseDur,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />

        {/* secondary core */}
        <motion.circle
          cx="200" cy="200" r="55"
          fill="url(#obs-core-2)"
          filter="url(#obs-softglow)"
          animate={{
            opacity: phase === 0 ? 0.08 : [0.55, 0.22, 0.55],
          }}
          transition={{
            opacity: {
              duration: pulseDur * 1.15,
              repeat: Infinity,
              delay: 0.6,
              ease: "easeInOut",
            },
          }}
        />

        {/* core border */}
        <motion.circle
          cx="200" cy="200" r="44"
          fill="none"
          strokeWidth="0.9"
          filter="url(#obs-glow)"
          stroke={CYAN}
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === 0
              ? [0.10, 0.04, 0.10]
              : phase === 1
              ? [0.38, 0.18, 0.38]
              : 0.62,
          }}
          transition={{
            opacity: {
              duration: pulseDur * 0.82,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />

        {/* crosshair */}
        {[
          { x1: 183, y1: 200, x2: 217, y2: 200 },
          { x1: 200, y1: 183, x2: 200, y2: 217 },
        ].map((l, i) => (
          <motion.line
            key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            strokeWidth="0.4"
            stroke={CYAN}
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase === 0 ? 0.05 : ringOp * 0.85,
            }}
            transition={{ duration: 3.0 }}
          />
        ))}

        {/* center dot */}
        <motion.circle
          cx="200" cy="200" r="2.8"
          filter="url(#obs-glow)"
          fill={CYAN}
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === 0 ? 0.18 : [0.88, 0.40, 0.88],
          }}
          transition={{
            opacity: {
              duration: pulseDur * 0.72,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />

        {/* ripple rings */}
        {phase === 2 && [0, 1, 2].map((i) => (
          <motion.circle
            key={`ripple-${i}`}
            cx="200" cy="200"
            fill="none"
            stroke={CYAN}
            strokeWidth="0.55"
            initial={{ r: 44, opacity: 0.45 }}
            animate={{ r: 188, opacity: 0 }}
            transition={{
              duration: 6.5,
              ease: "easeOut",
              delay: i * 2.1,
              repeat: Infinity,
              repeatDelay: 3.0,
            }}
          />
        ))}
      </svg>

      {/* state label */}
      <motion.p
        className="absolute whitespace-nowrap font-mono"
        style={{
          bottom: -36,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 7.5,
          letterSpacing: "0.56em",
          textTransform: "uppercase",
          color: "#38bdf8",
        }}
        animate={{
          opacity:
            phase === 0 ? [0.20, 0.07, 0.20] :
            phase === 1 ? 0.28 :
            0.44,
        }}
        transition={{
          opacity: phase === 0
            ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
            : { duration: 2.2 },
        }}
      >
        {phase === 0 ? "trace detected" : phase === 1 ? "observatory awakening" : "signal acquired"}
      </motion.p>
    </>
  );
}

// waveform band
function WaveformBand({ phase }: PhaseProps) {
  const wfKey: WFKey = phase === 0 ? "dormant" : phase === 1 ? "waking" : "alive";
  const CYAN = "#38bdf8";

  // opacity
  const baseOp = phase === 0 ? 0.16 : phase === 1 ? 0.38 : 0.62;
  // breath duration
  const dur    = phase === 0 ? 12   : phase === 1 ? 7    : 5;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 3.5, ease: CINEMATIC_EASE, delay: 0.8 }}
    >
      <svg
        viewBox="0 0 300 50"
        width={300}
        height={44}
        style={{ overflow: "visible" }}
        aria-hidden
      >
        <defs>
          <filter id="wf-glow" x="-25%" y="-130%" width="150%" height="360%">
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* pulse glow */}
          <filter id="wf-pulse-glow" x="-30%" y="-150%" width="160%" height="400%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* wide glow */}
        <motion.path
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          filter="url(#wf-glow)"
          stroke={CYAN}
          initial={{ opacity: 0 }}
          animate={{
            d: WF[wfKey],
            opacity: baseOp * 0.18,
          }}
          transition={{ d: { duration: 2.8, ease: "easeInOut" } }}
        />

        {/* primary wave */}
        <motion.path
          fill="none"
          strokeWidth="0.9"
          strokeLinecap="round"
          stroke={CYAN}
          initial={{ opacity: 0 }}
          animate={{
            d: WF[wfKey],
            opacity: phase === 0
              ? [baseOp * 0.55, baseOp * 0.18, baseOp * 0.55]
              : [baseOp, baseOp * 0.44, baseOp],
          }}
          transition={{
            d:       { duration: 2.4, ease: "easeInOut" },
            opacity: { duration: dur, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* traveling dot */}
        {phase > 0 && (
          <circle r="2.0" fill={CYAN} filter="url(#wf-glow)">
            <animateMotion
              dur={`${phase === 1 ? 8 : 5.5}s`}
              repeatCount="indefinite"
              path={WF[wfKey]}
            />
            <animate
              attributeName="opacity"
              values={`0;${baseOp * 0.95};${baseOp * 0.95};0`}
              dur={`${phase === 1 ? 8 : 5.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* stronger pulse */}
        {phase === 2 && (
          <circle r="3.2" fill={CYAN} filter="url(#wf-pulse-glow)">
            <animateMotion dur="11s" repeatCount="indefinite" path={WF.alive} begin="5.5s" />
            <animate
              attributeName="opacity"
              values="0;0.55;0.55;0"
              dur="11s"
              repeatCount="indefinite"
              begin="5.5s"
            />
          </circle>
        )}
      </svg>
    </motion.div>
  );
}

// floating transmission
// Each transmission has unique sz, opacity, blur, motion - no two are alike.
// scrollReveal 1 = appears at phase 1+, scrollReveal 2 = appears only at phase 2.
function FloatingTransmission({ text, sz, op, blur, dur, delay, dy, dx, x, y, scrollReveal, phase }: FloatingTransmissionProps) {
  const isVisible = phase >= scrollReveal;
  // phase op
  const targetOp = !isVisible ? 0 : scrollReveal === 1 && phase === 1 ? op * 0.45 : op;

  return (
    <motion.div
      className="pointer-events-none absolute select-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: targetOp }}
      transition={{
        duration: 5,
        delay: isVisible ? delay * 0.35 + 0.5 : 0,
        ease: CINEMATIC_EASE,
      }}
    >
      {/* drift - CSS custom props, zero JS RAF */}
      <span
        className="block font-mono lowercase"
        style={{
          fontSize: sz,
          letterSpacing: "0.34em",
          color: "rgba(148,163,184,0.92)",
          whiteSpace: "nowrap",
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          ["--ft-dy" as string]: `${dy}px`,
          ["--ft-dx" as string]: `${dx}px`,
          animation: `ft-drift ${dur}s ease-in-out ${delay}s infinite`,
          willChange: "transform",
        }}
      >
        {text}
      </span>
    </motion.div>
  );
}

// ai whisper cycle
function AIWhisper({ phase }: PhaseProps) {
  const [idx, setIdx] = useState(0);
  const [showing, setShowing] = useState(true);

  useEffect(() => {
    if (phase === 0) return;
    const iv = setInterval(() => {
      setShowing(false);
      const t = setTimeout(() => {
        setIdx((n) => (n + 1) % WHISPERS.length);
        setShowing(true);
      }, 1400);
      return () => clearTimeout(t);
    }, 6200);
    return () => clearInterval(iv);
  }, [phase]);

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 0 ? 0 : 1 }}
      transition={{ duration: 3.0, delay: 2.0, ease: CINEMATIC_EASE }}
    >
      {/* amber dot - CSS pulse, zero JS RAF */}
      <div
        className="shrink-0 rounded-full"
        style={{
          width: 3.5, height: 3.5,
          backgroundColor: "rgba(251,191,36,0.52)",
          animation: "aw-pulse 2.4s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      >
        <style>{`
          @keyframes aw-pulse {
            0%,100% { opacity: 1;    transform: scale(1);   }
            50%      { opacity: 0.12; transform: scale(0.7); }
          }
        `}</style>
      </div>
      <motion.p
        key={idx}
        className="font-mono lowercase"
        style={{
          fontSize: 9.5,
          letterSpacing: "0.26em",
          color: "rgba(148,163,184,0.30)",
        }}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: showing ? 1 : 0, y: showing ? 0 : -2 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      >
        {WHISPERS[idx]}
      </motion.p>
    </motion.div>
  );
}

// observatory panel
function ObservatoryPanel({ phase }: PhaseProps) {
  return (
    <div className="relative flex flex-col items-center gap-10 lg:gap-14 w-full">

      {/* background transmissions */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: "min(420px, 88vw)", height: "min(420px, 88vw)" }}
      >
        {/* floating transmissions */}
        {TRANSMISSIONS.map((t, i) => (
          <FloatingTransmission key={i} {...t} phase={phase} />
        ))}

        {/* orb */}
        <ObservatoryOrb phase={phase} />
      </div>

      {/* waveform */}
      <WaveformBand phase={phase} />

      {/* ai whisper */}
      <AIWhisper phase={phase} />
    </div>
  );
}

// left typography
function LeftTypography({ inView }: LeftTypographyProps) {
  return (
    <div className="flex flex-col justify-center" style={{ gap: "clamp(2.5rem,4.5vw,4.5rem)" }}>

      {/* eyebrow */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -16 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 2.2, ease: CINEMATIC_EASE }}
      >
        <span
          className="h-px shrink-0"
          style={{ width: 28, background: "rgba(56,189,248,0.20)" }}
        />
        <span
          className="font-mono uppercase"
          style={{ fontSize: 10, letterSpacing: "0.58em", color: "rgba(56,189,248,0.55)" }}
        >
          Project Pulse
        </span>
      </motion.div>

      {/* headline */}
      <motion.h2
        initial={{ opacity: 0, y: 22, filter: "blur(16px)" }}
        animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 3.0, delay: 0.08, ease: CINEMATIC_EASE }}
        style={{
          fontSize: "clamp(2.6rem,4.0vw,3.7rem)",
          fontWeight: 800,
          // tighter tracking
          letterSpacing: "-0.040em",
          lineHeight: 1.05,
          // warmer white
          color: "rgba(235,240,245,0.95)",
        }}
      >
        The archive
        <br />
        {/* still ghost-like */}
        <span
          style={{
            fontWeight: 200,
            fontStyle: "italic",
            // warmer dimension
            color: "rgba(180,196,214,0.45)",
            letterSpacing: "-0.018em",
          }}
        >
          still{"\u00A0"}
        </span>
        <span style={{ letterSpacing: "-0.044em" }}>listens.</span>
      </motion.h2>

      {/* thin rule */}
      <motion.div
        className="h-px origin-left"
        style={{
          width: 56,
          background: "linear-gradient(to right, rgba(56,189,248,0.16), transparent)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 2.4, delay: 0.42, ease: CINEMATIC_EASE }}
      />

      {/* body */}
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 2.6, delay: 0.52, ease: CINEMATIC_EASE }}
        className="max-w-md leading-loose tracking-wide"
        style={{
          fontSize: "clamp(1.1rem,1.5vw,1.3rem)",
          color: "rgba(203,213,225,0.75)",
        }}
      >
        Dormant projects still emit fragments of intent, unfinished
        thinking, and distant activity - long after the last commit.
      </motion.p>

      {/* secondary */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 2.6, delay: 0.72, ease: CINEMATIC_EASE }}
        className="leading-[1.92]"
        style={{
          maxWidth: "32ch",
          fontSize: "clamp(1.0rem,1.3vw,1.15rem)",
          color: "rgba(148,163,184,0.55)",
        }}
      >
        The system does not stop watching when you do.
      </motion.p>

      {/* amber anchor */}
      <motion.div
        className="flex items-start gap-4"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 3.5, delay: 1.05, ease: CINEMATIC_EASE }}
      >
        <motion.div
          className="mt-1.5 shrink-0 rounded-full"
          style={{ width: 4, height: 4, background: "rgba(251,191,36,0.65)" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <p
          className="font-mono italic"
          style={{
            fontSize: 11.5,
            letterSpacing: "0.14em",
            color: "rgba(251,191,36,0.45)",
            lineHeight: 1.7,
          }}
        >
          Some projects never truly go silent.
        </p>
      </motion.div>
    </div>
  );
}

// atmospheric background
function AtmosphericBg({ phase }: { phase: 0 | 1 | 2 }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>

      {/* deep space base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 85% at 60% 48%, #060d1c 0%, #040a14 42%, #030810 100%)",
        }}
      />

      {/* ambient glow */}
      <motion.div
        className="absolute"
        style={{ right: "-5%", top: "8%", width: 640, height: 640 }}
        animate={{ opacity: phase === 0 ? 0.15 : phase === 1 ? 0.42 : 0.85 }}
        transition={{ duration: 6, ease: "easeInOut" }}
      >
        <div
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(14,165,233,0.025) 0%, transparent 60%)",
          }}
        />
      </motion.div>

      {/* diffuse glow */}
      <motion.div
        className="absolute"
        style={{ left: "10%", bottom: "15%", width: 380, height: 280 }}
        animate={{ opacity: phase === 0 ? 0 : phase === 1 ? 0.3 : 0.6 }}
        transition={{ duration: 7, ease: "easeInOut" }}
      >
        <div
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(14,165,233,0.012) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* faint shaft */}
      <motion.div
        className="absolute inset-y-0"
        style={{
          right: "38%",
          width: 1.5,
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(56,189,248,0.035) 35%, rgba(56,189,248,0.035) 65%, transparent 100%)",
        }}
        animate={{ opacity: phase === 0 ? 0 : phase === 1 ? 0.5 : 1.0 }}
        transition={{ duration: 5, ease: "easeInOut" }}
      />

      {/* offset shaft */}
      <motion.div
        className="absolute inset-y-0"
        style={{
          right: "36%",
          width: 0.5,
          background:
            "linear-gradient(to bottom, transparent 10%, rgba(56,189,248,0.018) 40%, rgba(56,189,248,0.018) 60%, transparent 90%)",
        }}
        animate={{ opacity: phase === 0 ? 0 : phase === 1 ? 0.35 : 0.70 }}
        transition={{ duration: 5.5, ease: "easeInOut" }}
      />

      {/* horizontal haze - CSS drift, zero JS RAF */}
      <style suppressHydrationWarning>{`
        @keyframes pp-drift-a { 0%,100%{transform:translate(0,0)} 50%{transform:translate(22px,-12px)} }
        @keyframes pp-drift-b { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-14px,8px)} }
        @keyframes pp-rise {
          0%   { transform:translateY(0); opacity:0; }
          20%  { opacity:var(--pp-op); }
          80%  { opacity:var(--pp-op); }
          100% { transform:translateY(var(--pp-rise)); opacity:0; }
        }
      `}</style>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 52% 42% at 16% 65%, rgba(4,10,24,0.18) 0%, transparent 70%)",
          animation: "pp-drift-a 42s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* counter drift */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 40% 35% at 82% 28%, rgba(4,10,24,0.12) 0%, transparent 65%)",
          animation: "pp-drift-b 58s ease-in-out infinite",
          willChange: "transform",
        }}
      />

      {/* ambient micro-particles - CSS custom props per particle */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.l,
            top:  p.t,
            width:  p.s,
            height: p.s,
            backgroundColor: p.warm ? "rgba(251,191,36,1)" : "rgba(140,158,180,1)",
            ["--pp-op" as string]: String(p.op),
            ["--pp-rise" as string]: `-${p.rise}px`,
            animation: `pp-rise ${p.dur}s ease-in-out ${p.dl}s infinite`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}

// main export
export function ProjectPulse() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef    = useRef<HTMLDivElement>(null);

  const leftInView = useInView(leftRef, { once: true, margin: "-80px" });

  // track scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // smooth progress
  const smooth = useSpring(scrollYProgress, { stiffness: 24, damping: 16 });

  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    let prevPhase: 0 | 1 | 2 = 0;
    const unsub = smooth.on("change", (v) => {
      const next: 0 | 1 | 2 = v < 0.16 ? 0 : v < 0.40 ? 1 : 2;
      // Only re-render when phase actually changes - not on every scroll frame
      if (next !== prevPhase) {
        prevPhase = next;
        setPhase(next);
      }
    });
    return () => unsub();
  }, [smooth]);

  return (
    <section
      ref={sectionRef}
      id="project-pulse"
      className="relative overflow-hidden"
      style={{ background: "#030810" }}
    >
      {/* background */}
      <AtmosphericBg phase={phase} />

      {/* top transition */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10" aria-hidden>
        {/* gradient bleed */}
        <div
          className="absolute inset-x-0 top-0 h-44"
          style={{ background: "linear-gradient(to bottom, #030508 0%, transparent 100%)" }}
        />
        {/* residual particles */}
        {[
          { l: "49.2%", dur: 18, dl: 0.0, op: 0.09, rise: 88 },
          { l: "50.5%", dur: 24, dl: 3.2, op: 0.06, rise: 66 },
          { l: "50.0%", dur: 15, dl: 6.4, op: 0.08, rise: 74 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 rounded-full"
            style={{ left: p.l, width: 1, height: 1, background: "rgba(56,189,248,0.9)" }}
            animate={{ y: [0, -p.rise], opacity: [0, p.op, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.dl, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* main content */}
      <div
        className="relative mx-auto max-w-7xl px-6 py-32 md:py-44 lg:px-12"
        style={{ zIndex: 1 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-20 lg:gap-10 items-center">

          {/* left */}
          <div ref={leftRef} className="order-2 lg:order-1">
            <LeftTypography inView={leftInView} />
          </div>

          {/* right */}
          <div className="order-1 lg:order-2 flex justify-center items-center">
            <ObservatoryPanel phase={phase} />
          </div>

        </div>
      </div>

      {/* bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 z-10"
        style={{ background: "linear-gradient(to top, #0a0a0f 0%, transparent 100%)" }}
      />
    </section>
  );
}
