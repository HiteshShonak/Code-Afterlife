"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
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
      {/* â”€â”€ BACKGROUND ATMOSPHERE â”€â”€ */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        {/* Subtle Depth Glow â€” ultra-faint cold radial glow behind headline */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(14,165,233,0.015) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          animate={{
            opacity: [0.6, 1.0, 0.6],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Microscopic atmospheric motion â€” extremely slow moving faint noise/haze */}
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, -20, 0], y: [0, 10, 0] }}
          transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(ellipse 60% 50% at 30% 60%, rgba(255,255,255,0.008) 0%, transparent 60%)",
          }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 55, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(ellipse 50% 40% at 70% 30%, rgba(255,255,255,0.006) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="mx-auto flex flex-col items-center text-center">
        {/* Headline container â€” narrowed by using max-w-4xl instead of max-w-5xl */}
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

        {/* Buttons */}
        <motion.div
          className="mt-16 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 2.5, delay: 0.4, ease: CINEMATIC_EASE }}
        >
          {/* Primary Button */}
          <a
            href="#graveyard"
            className="group relative inline-flex items-center gap-2 rounded-full bg-foreground px-9 py-4.5 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-background transition-all duration-700 ease-out hover:-translate-y-[1px] hover:bg-[#f1f5f9] hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)]"
          >
            Explore Graveyard
            <span className="transition-transform duration-700 ease-out group-hover:translate-x-1">â†’</span>
          </a>

          {/* Secondary Button */}
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-transparent px-9 py-4.5 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground transition-all duration-700 ease-out hover:-translate-y-[1px] hover:border-foreground/30 hover:bg-foreground/[0.02]"
          >
            Start Building
          </a>
        </motion.div>

        {/* Randomized Philosophy Line */}
        <motion.div
          className="mt-12 md:mt-16"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 4.0, delay: 1.2, ease: CINEMATIC_EASE }}
        >
          <p
            className="font-mono text-[11px] uppercase tracking-[0.35em]"
            style={{ 
              color: "rgba(203,213,225,0.55)", // Brighter, more readable grey-blue
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
