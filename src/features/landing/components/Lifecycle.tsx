"use client";

import { useRef, useState, useEffect } from "react";
import { useScroll, motion } from "framer-motion";
import { SectionLabel } from "./SectionLabel";
import { ReactFlowLifecycle } from "./ReactFlowLifecycle";
import { CINEMATIC_EASE } from "@/lib/utils/animation";

const stages = [
  { code: "01", name: "Born",     desc: "The spark of intent. Clean lines, optimistic commits, and rapid velocity." },
  { code: "02", name: "Active",   desc: "Steady throughput. The pulse of progress is constant, sustaining the ecosystem." },
  { code: "03", name: "Stalled",  desc: "Issues pile up. Pull requests are ignored. The lead developer is silent." },
  { code: "04", name: "Dead",     desc: "Dependency hell. The repository is officially archived. The code rots in the dark." },
  { code: "05", name: "Flatline", desc: "The pulse stops. The repository is archived, the graph goes quiet, and the idea falls out of time." },
];

// stage colors
const STAGE_COLORS = ["#ffffff", "#8b5cf6", "#f59e0b", "#ef4444", "#ffffff"];
const STAGE_OPACITIES = ["1", "1", "1", "0.5", "0.28"];

// Precomputed color strings - avoids inline Math.round/parseFloat/toString(16) during render
const STAGE_GLOW_COLORS = STAGE_COLORS.map((c, i) => {
  const alpha = Math.round(parseFloat(STAGE_OPACITIES[i]) * 0.08 * 255).toString(16).padStart(2, "0");
  return `${c}${alpha}`;
});
const STAGE_BORDER_COLORS = STAGE_COLORS.map((c, i) => {
  const alpha = Math.round(parseFloat(STAGE_OPACITIES[i]) * 255).toString(16).padStart(2, "0");
  return `${c}${alpha}`;
});
const STAGE_BG_COLORS = STAGE_COLORS.map((c, i) => {
  const alpha = Math.round(parseFloat(STAGE_OPACITIES[i]) * 0.10 * 255).toString(16).padStart(2, "0");
  return `${c}${alpha}`;
});

export function Lifecycle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let prevIndex = 0;
    return scrollYProgress.on("change", (latest) => {
      const index = Math.min(stages.length - 1, Math.floor(latest * stages.length));
      // Only re-render when the stage actually changes - not on every scroll frame
      if (index !== prevIndex) {
        prevIndex = index;
        setActiveIndex(index);
      }
    });
  }, [scrollYProgress]);

  const isFlatline = activeIndex === stages.length - 1;

  return (
    <section ref={containerRef} id="lifecycle" className="relative h-[350vh] w-full bg-background border-t border-border/60">
      {/* sticky container */}
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">

        {/* fade overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 bg-linear-to-b from-transparent via-background/20 to-background"
          animate={{ opacity: isFlatline ? 1 : 0, filter: isFlatline ? "grayscale(1)" : "grayscale(0)" }}
          transition={{ duration: 1.8, ease: CINEMATIC_EASE }}
        />

        {/* desktop layout */}
        <div className="hidden md:flex mx-auto h-full max-w-7xl w-full items-center px-10">

          {/* left column */}
          <div className="flex h-full w-1/2 flex-col justify-center relative z-10">
            <div className="mb-12">
              <SectionLabel index="01" label="Lifecycle of a project" />
              <h2 className="mt-8 text-balance font-sans text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Every project moves<br/>through five quiet stages.
              </h2>
            </div>
            <div className="relative h-50 w-full max-w-125">
              {stages.map((stage, i) => {
                const isActive = activeIndex === i;
                return (
                  <motion.div
                    key={stage.code}
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      y: isActive ? 0 : 20,
                      filter: isActive ? "blur(0px)" : "blur(12px)",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                    transition={{ duration: 1.2, ease: CINEMATIC_EASE }}
                    className="absolute inset-0"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <span className={`inline-block size-1.5 rounded-full ${isActive && i !== stages.length - 1 ? 'bg-accent ca-pulse-dot' : 'bg-foreground/30'}`} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Stage {stage.code}</span>
                    </div>
                    <h3 className="mb-4 text-3xl font-bold tracking-tight text-foreground">{stage.name}</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">{stage.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* right column */}
          <div className="relative flex h-full w-1/2 items-center justify-center">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-100 w-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[120px]" />
            <ReactFlowLifecycle activeIndex={activeIndex} />
          </div>
        </div>

        {/* mobile layout */}
        <div className="flex md:hidden mx-auto h-full w-full flex-col justify-between px-6 py-20">

          {/* heading */}
          <div>
            <SectionLabel index="01" label="Lifecycle of a project" />
            <h2 className="mt-6 text-balance font-sans text-3xl font-extrabold tracking-tight text-foreground leading-tight">
              Every project moves<br/>through five quiet stages.
            </h2>
          </div>

          {/* card */}
          <div className="relative flex-1 flex flex-col items-center justify-center py-10">

            {/* ambient glow - uses precomputed color table */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-3xl blur-[80px]"
              animate={{
                backgroundColor: STAGE_GLOW_COLORS[activeIndex],
              }}
              transition={{ duration: 1.2, ease: CINEMATIC_EASE }}
            />

            {/* stage cards */}
            {stages.map((stage, i) => {
              const isActive = activeIndex === i;
              const color = STAGE_COLORS[i];
              const opacity = STAGE_OPACITIES[i];
              return (
                <motion.div
                  key={stage.code}
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    y: isActive ? 0 : 32,
                    scale: isActive ? 1 : 0.94,
                    filter: isActive ? "blur(0px)" : "blur(16px)",
                  }}
                  transition={{ duration: 1.4, ease: CINEMATIC_EASE }}
                  className="absolute inset-x-0 flex flex-col items-center text-center pointer-events-none"
                  style={{ pointerEvents: isActive ? "auto" : "none" }}
                >
                  {/* number */}
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] mb-4"
                    style={{ color, opacity: parseFloat(opacity) * 0.7 }}>
                    Stage {stage.code}
                  </span>

                  {/* node card - CSS transition on border/bg (fires on stage change, not every frame) */}
                  <div
                    className="w-full max-w-xs border rounded-2xl px-8 py-6 backdrop-blur-md mb-6"
                    style={{
                      borderColor: STAGE_BORDER_COLORS[i],
                      backgroundColor: STAGE_BG_COLORS[i],
                      transition: "border-color 1.2s ease, background-color 1.2s ease",
                    }}
                  >
                    {/* dot */}
                    {i < stages.length - 2 && (
                      <div className="flex justify-center mb-3">
                        <span
                          className="size-2 rounded-full animate-pulse"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    )}
                    <p className="font-mono text-xl font-bold tracking-[0.15em] uppercase"
                      style={{ color, opacity: parseFloat(opacity) }}>
                      {stage.name}
                    </p>
                    <p className="font-mono text-[9px] tracking-widest text-muted-foreground mt-1">
                      {["INIT","SYNC","WARN","HALT","SILENT"][i]}
                    </p>
                  </div>

                  {/* description */}
                  <p className="text-base leading-relaxed text-muted-foreground max-w-[30ch]">
                    {stage.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* progress */}
          <div className="flex justify-center gap-3 pb-4">
            {stages.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: activeIndex === i ? 20 : 6,
                  opacity: activeIndex === i ? 1 : 0.25,
                  backgroundColor: activeIndex === i ? STAGE_COLORS[activeIndex] : "#ffffff",
                }}
                transition={{ duration: 0.5 }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
