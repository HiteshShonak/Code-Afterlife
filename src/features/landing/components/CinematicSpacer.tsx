"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CINEMATIC_EASE } from "@/lib/utils/animation";

interface CinematicSpacerProps {
  topColor?: string;
  bottomColor?: string;
  glowColor?: string;
  height?: string;
}

export function CinematicSpacer({
  topColor = "var(--background, #080a10)",
  bottomColor = "#030508",
  glowColor = "rgba(180,100,20,0.07)",
  height = "45vh",
}: CinematicSpacerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <div
      ref={ref}
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{
        height,
        background: `linear-gradient(to bottom, ${topColor} 0%, ${bottomColor} 100%)`,
      }}
    >
      {/* ── AMBIENT GLOW (The "Color Mixing") ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 3, ease: CINEMATIC_EASE }}
        className="pointer-events-none absolute w-[800px] h-[500px] rounded-full blur-[100px]"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 60%)`,
        }}
      />

      {/* ── TINY SCROLL PARTICLES ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${15 + (i * 37) % 70}%`,
              top: `${10 + (i * 53) % 80}%`,
              width: 1 + (i % 2) * 0.5,
              height: 1 + (i % 2) * 0.5,
              boxShadow: `0 0 8px ${glowColor.replace(/,[0-9.]+$/, ",0.8)")}`,
            }}
            animate={{ y: [0, -40, 0], opacity: [0, 0.4, 0] }}
            transition={{
              duration: 6 + (i % 4) * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i * 0.5) % 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
