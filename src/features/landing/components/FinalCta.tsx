"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { CINEMATIC_EASE } from "@/lib/utils/animation";

const PHILOSOPHY_LINES: readonly string[] = [
  "Nothing stays buried forever.",
  "The archive is patient.",
  "Ideas age. Good ones return.",
  "Some code just needs more time.",
  "A different builder. A different time.",
  "Every archived project waits for its moment.",
  "The story rarely ends with the last commit.",
  "Some projects never truly go silent.",
];

export function FinalCta() {
  const containerRef = useRef<HTMLElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-100px" });
  const [whisper, setWhisper] = useState<string>("");

  useEffect(() => {
    // Pick once on mount to avoid hydration mismatch
    const randomIndex = Math.floor(Math.random() * PHILOSOPHY_LINES.length);
    setWhisper(PHILOSOPHY_LINES[randomIndex]);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative overflow-hidden border-t border-border/60 px-6 pt-24 pb-20 md:pt-32 md:pb-28"
    >
      {/* background atmosphere - CSS-only animations, zero JS RAF cost */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <style>{`
          @keyframes fca-glow-pulse {
            0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.95); }
            50%       { opacity: 1.0; transform: translate(-50%, -50%) scale(1.05); }
          }
          @keyframes fca-drift-a {
            0%, 100% { transform: translate(0, 0); }
            50%       { transform: translate(-20px, 10px); }
          }
          @keyframes fca-drift-b {
            0%, 100% { transform: translate(0, 0); }
            50%       { transform: translate(15px, -15px); }
          }
        `}</style>

        {/* subtle depth glow */}
        <div
          className="absolute left-1/2 top-1/2 h-200 w-200 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(14,165,233,0.015) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "fca-glow-pulse 18s ease-in-out infinite",
            willChange: "transform, opacity",
          }}
        />

        {/* atmospheric drift A */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 30% 60%, rgba(255,255,255,0.008) 0%, transparent 60%)",
            animation: "fca-drift-a 45s ease-in-out infinite",
            willChange: "transform",
          }}
        />

        {/* atmospheric drift B */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 50% 40% at 70% 30%, rgba(255,255,255,0.006) 0%, transparent 60%)",
            animation: "fca-drift-b 55s ease-in-out infinite",
            willChange: "transform",
          }}
        />
      </div>


      <div className="mx-auto flex flex-col items-center text-center">
        {/* headline container */}
        <motion.div
          className="max-w-4xl"
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 2.8, ease: CINEMATIC_EASE }}
        >
          <h2 className="text-balance text-5xl font-extrabold leading-[0.92] tracking-[-0.04em] text-foreground md:text-8xl">
            Some projects deserve <br className="hidden md:block" />
            another builder.
          </h2>
        </motion.div>

        {/* buttons */}
        <motion.div
          className="mt-16 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 2.5, delay: 0.4, ease: CINEMATIC_EASE }}
        >
          {/* primary button */}
          <Link
            href="/graveyard"
            className="group relative inline-flex items-center gap-2 rounded-full bg-foreground px-9 py-4.5 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-background transition-all duration-700 ease-out hover:-translate-y-px hover:bg-[#f1f5f9] hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)]"
          >
            Explore Graveyard
            <span className="transition-transform duration-700 ease-out group-hover:translate-x-1">→</span>
          </Link>

          {/* secondary button */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-transparent px-9 py-4.5 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground transition-all duration-700 ease-out hover:-translate-y-px hover:border-foreground/30 hover:bg-foreground/2"
          >
            Start Exploring
          </Link>
        </motion.div>

        {/* randomized philosophy line */}
        <motion.div
          className="mt-12 md:mt-16"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 4.0, delay: 1.2, ease: CINEMATIC_EASE }}
        >
          <p
            className="font-mono text-[11px] uppercase tracking-[0.35em]"
            style={{ 
              color: "rgba(203,213,225,0.55)",
              letterSpacing: "0.35em"
            }}
          >
            {whisper}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
