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

  // Derive glow color at opacity 0.8 for the box-shadow highlight
  const glowHighlight = glowColor.replace(/,[0-9.]+\)$/, ",0.8)");

  return (
    <div
      ref={ref}
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{
        height,
        background: `linear-gradient(to bottom, ${topColor} 0%, ${bottomColor} 100%)`,
      }}
    >
      {/* ambient glow — inView-triggered one-shot (Framer OK here, not infinite) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 3, ease: CINEMATIC_EASE }}
        className="pointer-events-none absolute w-[800px] h-[500px] rounded-full blur-[100px]"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 60%)`,
        }}
      />

      {/* scroll particles — CSS-only, zero JS RAF cost (renders 4× on page = 24 loops saved) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <style>{`
          @keyframes cs-particle {
            0%, 100% { transform: translateY(0);   opacity: 0; }
            20%       { opacity: 0.4; }
            80%       { opacity: 0.4; }
            50%       { transform: translateY(-40px); }
          }
        `}</style>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${15 + (i * 37) % 70}%`,
              top: `${10 + (i * 53) % 80}%`,
              width: 1 + (i % 2) * 0.5,
              height: 1 + (i % 2) * 0.5,
              boxShadow: `0 0 8px ${glowHighlight}`,
              animation: `cs-particle ${6 + (i % 4) * 2}s ease-in-out ${(i * 0.5) % 2}s infinite`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>
    </div>
  );
}

