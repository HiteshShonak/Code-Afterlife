"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CINEMATIC_EASE } from "@/lib/utils/animation";

// lazy load canvas
const GraveyardCanvas = dynamic(
  () => import("./GraveyardCanvas").then((m) => m.GraveyardCanvas),
  { ssr: false, loading: () => null }
);

// mobile fallback

function MobileFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-[#050c1a] via-[#071325] to-[#09090c]" />
      {/* moon */}
      <div className="absolute left-[18%] top-[12%] h-28 w-28 rounded-full bg-[#7a9bd4]/8 blur-3xl" />
      <div className="absolute left-[19.5%] top-[13%] h-12 w-12 rounded-full bg-[#8caee8]/15 blur-xl" />
      {/* moon haze */}
      <div className="absolute left-[8%] top-[5%] h-64 w-80 bg-[#1a2e52]/12 blur-[80px] rounded-full" />
      {/* tombstone silhouettes */}
      <div className="absolute bottom-[26%] left-[14%] w-9 h-20 bg-foreground/12 rounded-t-full" />
      <div className="absolute bottom-[26%] right-[16%] w-10 h-22 bg-foreground/12 rounded-t-full" />
      <div className="absolute bottom-[26%] left-[8%] w-7 h-14 bg-foreground/8 rounded-t-full" />
      <div className="absolute bottom-[26%] right-[8%] w-7 h-15 bg-foreground/8 rounded-t-full" />
      {/* ground fog */}
      <div className="absolute bottom-0 inset-x-0 h-[40%] bg-linear-to-t from-[#06101e]/85 via-[#091626]/40 to-transparent blur-2xl" />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(0,0,0,0.82)_100%)]" />
    </div>
  );
}

// moon parallax

function MoonParallax() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // spring damped
  const springX = useSpring(mouseX, { stiffness: 18, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 18, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const rect = (currentTarget as HTMLElement).getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width  - 0.5;  // −0.5 → +0.5
    const ny = (clientY - rect.top)  / rect.height - 0.5;
    mouseX.set(nx * -2.2); // max ±1.1px
    mouseY.set(ny * -1.6); // max ±0.8px
  };

  return { springX, springY, handleMouseMove };
}

// section

export function Graveyard() {
  const sectionRef  = useRef<HTMLElement>(null);

  // darkening veil
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 0.5, 0]);
  const textY          = useTransform(scrollYProgress, [0, 1], [28, 0]);

  // moon parallax state
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 18, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 18, damping: 28 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left)  / rect.width  - 0.5;
    const ny = (e.clientY - rect.top)   / rect.height - 0.5;
    mouseX.set(nx * -2.2);
    mouseY.set(ny * -1.6);
  };

  return (
    <section
      ref={sectionRef}
      id="graveyard-preview"
      className="relative isolate overflow-hidden"
      style={{ minHeight: "100vh" }}
      onMouseMove={handleMouseMove}
    >
      {/* canvas */}
      <div className="absolute inset-0 z-0">
        <div className="hidden md:block absolute inset-0">
          <GraveyardCanvas />
        </div>
        <div className="block md:hidden absolute inset-0">
          <MobileFallback />
        </div>
      </div>

      {/* moon parallax layer */}
      <motion.div
        className="pointer-events-none absolute hidden md:block z-5"
        style={{
          left: "18%", top: "8%",
          width: 180, height: 180,
          x: springX, y: springY,
        }}
      >
        {/* outer halo */}
        <div className="absolute inset-0 rounded-full bg-[#6080c0]/4 blur-3xl scale-[2.5]" />
        {/* inner ring */}
        <div className="absolute inset-[28%] rounded-full bg-[#8aaee8]/6 blur-xl" />
      </motion.div>

      {/* scroll entry veil */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 bg-background"
        style={{ opacity: overlayOpacity }}
      />

      {/* scene vignette */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.78)_100%)]" />

      {/* top fade */}
      <div className="pointer-events-none absolute top-0 inset-x-0 z-20 h-52 bg-linear-to-b from-background to-transparent" />

      {/* bottom fade */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 z-20 h-52 bg-linear-to-t from-background to-transparent" />

      {/* text overlay */}
      <div className="relative z-30 flex min-h-screen flex-col items-center justify-between px-6 py-16 md:px-10 md:py-24">

        {/* eyebrow label */}
        <motion.div
          style={{ y: textY }}
          initial={{ opacity: 0, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 2.2, delay: 0.3, ease: CINEMATIC_EASE }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.5em] text-foreground/30">
            <span className="h-px w-10 bg-foreground/15" />
            <span>The Graveyard</span>
            <span className="h-px w-10 bg-foreground/15" />
          </div>
        </motion.div>

        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 2.8, delay: 0.45, ease: CINEMATIC_EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          {/* moon haze gradient */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[-55%] w-150 h-90 bg-[radial-gradient(ellipse_at_center,rgba(24,42,80,0.22)_0%,transparent_68%)] blur-2xl" />

          <h2 className="relative text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08]">
            Some projects deserve
            <br />
            <span className="text-foreground/50">another builder.</span>
          </h2>

          <p className="relative mx-auto mt-7 max-w-[38ch] text-pretty text-base leading-relaxed text-foreground/35 md:text-lg">
            Every abandoned idea leaves behind a story.
          </p>

          <div className="relative mx-auto mt-10 h-px w-12 bg-foreground/10" />
        </motion.div>

        {/* cta */}
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 2.0, delay: 0.85, ease: CINEMATIC_EASE }}
          className="relative flex flex-col items-center gap-4"
        >
          {/* atmospheric cloud */}
          <div className="pointer-events-none absolute -inset-x-16 -inset-y-8 bg-[radial-gradient(ellipse_at_center,rgba(8,16,32,0.55)_0%,transparent_70%)] blur-xl" />

          {/* primary cta */}
          <Link
            href="/graveyard"
            className="relative group inline-flex items-center gap-3 border border-foreground/18 bg-black/30 px-7 py-3.5 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/65 backdrop-blur-sm transition-all duration-700
              hover:border-foreground/35 hover:bg-black/50 hover:text-foreground/90
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
          >
            {/* shimmer */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/4 to-transparent transition-transform duration-900 group-hover:translate-x-full" />
            {/* top border */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-foreground/25 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            <span className="relative">Enter the Graveyard</span>
            <span className="relative transition-transform duration-500 group-hover:translate-x-1 text-foreground/40 group-hover:text-foreground/75">→</span>
          </Link>

          {/* secondary link */}
          <Link
            href="/legacy"
            className="relative font-mono text-[9px] uppercase tracking-[0.4em] text-foreground/20 transition-colors duration-600 hover:text-foreground/45 focus-visible:text-foreground/45 focus-visible:outline-none"
          >
            View Legacy
          </Link>

          {/* scroll indicator - CSS bob, zero JS RAF */}
          <div className="mt-3 flex flex-col items-center gap-1.5 opacity-20"
            style={{ animation: "gy-bob 2.8s ease-in-out infinite", willChange: "transform" }}
          >
            <style>{`@keyframes gy-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }`}</style>
            <div className="h-7 w-4 rounded-full border border-foreground/35 flex items-start justify-center pt-1.5">
              <div className="h-1.5 w-0.5 rounded-full bg-foreground/50" />
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
