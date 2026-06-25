"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const heroParticles = Array.from({ length: 45 }).map((_, i) => {
  const seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
  const rand = seed - Math.floor(seed);
  const seedTwo = Math.sin((i + 1) * 78.233) * 24634.6345;
  const randTwo = seedTwo - Math.floor(seedTwo);
  const seedThree = Math.sin((i + 1) * 39.425) * 12876.1234;
  const randThree = seedThree - Math.floor(seedThree);
  const fixed = (value: number) => value.toFixed(4);

  return {
    id: i,
    left: `${fixed(rand * 100)}%`,
    top: `${fixed(40 + randTwo * 60)}%`,
    duration: `${fixed(18 + randThree * 25)}s`,
    delay: `${fixed(rand * -20)}s`,
    opacity: fixed(0.1 + randTwo * 0.4),
    x: `${fixed((randThree - 0.5) * 80)}px`,
    y: `-${fixed(150 + rand * 300)}px`,
  };
});

function Particles() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {heroParticles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 bg-white rounded-full ca-dust"
          style={{
            left: p.left,
            top: p.top,
            "--tw-dust-duration": p.duration,
            "--tw-dust-delay": p.delay,
            "--tw-dust-opacity": p.opacity,
            "--tw-dust-x": p.x,
            "--tw-dust-y": p.y,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isVisible = true; // track viewport visibility

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const animate = () => {
      if (!isVisible) {
        // Section is off-screen - stop the loop, save GPU/CPU
        animationFrameId = requestAnimationFrame(animate);
        return;
      }
      // smooth lerp
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      if (bgRef.current) {
        // background shift
        bgRef.current.style.transform = `translate(${currentX * -0.3}%, ${currentY * -0.3}%)`;
      }
      if (panelsRef.current) {
        // foreground shift
        panelsRef.current.style.transform = `translate(${currentX * -0.7}%, ${currentY * -0.7}%)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Pause RAF when hero is scrolled out of view
    const section = bgRef.current?.closest("section");
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0 }
    );
    if (section) observer.observe(section);

    window.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  return (
    <section className="relative isolate flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-28 md:h-screen md:min-h-190 md:px-0 md:py-0">
      {/* background image */}
      <div className="absolute inset-0 -z-30 bg-background overflow-hidden">
        {/* inner background */}
        <div ref={bgRef} className="absolute inset-[-8%] translate-x-[-1%] md:inset-[-5%]">
          <Image
            src="/hero-image.webp"
            alt="A vast foggy ravine of digital ruins with floating abandoned software panels and a distant light beam on the horizon"
            fill
            priority
            sizes="100vw"
            className="ca-ken-burns h-full w-full object-cover object-[58%_center] select-none pointer-events-none sm:object-[52%_center]"
            draggable={false}
          />
        </div>
      </div>

      <Particles />

      {/* fog layers */}
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        {/* deep background fog */}
        <div className="absolute bottom-0 left-[-20%] h-[80%] w-[140%] ca-fog-drift-1 bg-linear-to-t from-background via-accent/10 to-transparent blur-3xl opacity-80 mix-blend-screen" />
        {/* foreground fog */}
        <div className="absolute bottom-[-10%] left-[-10%] h-[60%] w-[120%] ca-fog-drift-2 bg-linear-to-t from-background via-background/80 to-transparent blur-2xl opacity-90" />
      </div>

      {/* panels */}
      <div className="pointer-events-none absolute inset-0 -z-10 perspective-[1000px]">
        <div ref={panelsRef} className="absolute inset-0">
          {/* panel 1 */}
          <div 
            className="absolute left-[3%] top-[24%] h-44 w-32 rounded-2xl border border-accent/20 bg-background/5 opacity-45 shadow-[0_0_30px_rgba(139,92,246,0.1)] backdrop-blur-md ca-panel-float sm:left-[12%] sm:top-[30%] sm:h-64 sm:w-48 sm:opacity-70"
            style={{ "--tw-panel-rx": "12deg", "--tw-panel-ry": "28deg", "--tw-panel-duration": "18s" } as React.CSSProperties}
          >
            <div className="w-full h-full p-5 flex flex-col gap-4 opacity-40 mix-blend-plus-lighter">
              <div className="h-1.5 w-1/3 bg-accent/60 rounded-full" />
              <div className="h-1 w-3/4 bg-white/30 rounded-full" />
              <div className="h-1 w-1/2 bg-white/30 rounded-full" />
              <div className="mt-auto flex justify-between border-t border-white/10 pt-4">
                <div className="h-6 w-6 rounded bg-white/20" />
                <div className="h-6 w-6 rounded bg-white/20" />
              </div>
            </div>
          </div>

          {/* panel 2 */}
          <div 
            className="absolute right-[-18%] top-[58%] h-32 w-48 rounded-2xl border border-white/10 bg-background/10 opacity-35 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-lg ca-panel-float sm:right-[8%] sm:top-[50%] sm:h-44 sm:w-64 sm:opacity-50"
            style={{ "--tw-panel-rx": "-15deg", "--tw-panel-ry": "-35deg", "--tw-panel-duration": "24s" } as React.CSSProperties}
          >
            <div className="w-full h-full p-4 flex flex-col gap-2 opacity-30">
              <div className="h-0.5 w-full bg-white/40 rounded-full mb-3" />
              <div className="h-0.5 w-full bg-white/20 rounded-full" />
              <div className="h-0.5 w-4/5 bg-white/20 rounded-full" />
              <div className="h-0.5 w-5/6 bg-white/20 rounded-full" />
              <div className="h-0.5 w-1/2 bg-white/20 rounded-full mt-auto" />
            </div>
          </div>

          {/* panel 3 */}
          <div 
            className="absolute right-[20%] top-[14%] h-20 w-20 rounded-xl border border-accent/10 bg-accent/5 opacity-20 blur-[3px] backdrop-blur-sm ca-panel-float sm:right-[30%] sm:top-[15%] sm:h-32 sm:w-32 sm:opacity-30"
            style={{ "--tw-panel-rx": "5deg", "--tw-panel-ry": "15deg", "--tw-panel-duration": "32s" } as React.CSSProperties}
          />
        </div>
      </div>

      {/* lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-linear-to-b from-transparent via-background/80 to-background" />
        <div className="ca-pulse-glow absolute left-1/2 top-1/2 h-100 w-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 mix-blend-screen md:h-175 md:w-175" />
        <div className="ca-grain absolute inset-0 opacity-40 mix-blend-overlay" />
        {/* text shadow */}
        <div className="absolute left-1/2 top-1/2 h-90 w-[88vw] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/35 blur-3xl md:h-130 md:w-275" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
        <h1 className="text-balance font-sans text-[4.35rem] font-extrabold leading-[0.88] tracking-normal text-foreground min-[390px]:text-[5.1rem] sm:text-[6.5rem] md:text-[9.5rem]">
          Software
          <br />
          Never Dies.
        </h1>
        <p className="mx-auto mt-6 max-w-[34ch] text-pretty font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:max-w-[44ch] sm:text-xs sm:tracking-[0.25em] md:mt-8 md:text-sm">
          Projects decay. Builders disappear. Code survives.
        </p>
        <div className="mx-auto mt-9 flex w-full max-w-xs flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center sm:gap-4 md:mt-12">
          <Link
            href="/graveyard"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-background transition-colors duration-500 hover:bg-accent hover:text-accent-foreground sm:px-7 sm:text-[11px] sm:tracking-[0.22em]"
          >
            Enter the Graveyard
            <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 px-6 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors duration-500 hover:bg-foreground/5 sm:px-7 sm:text-[11px] sm:tracking-[0.22em]"
          >
            Explore Projects
          </Link>
        </div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-10 sm:gap-3">
        <span className="font-mono text-[8px] uppercase tracking-[0.34em] text-muted-foreground sm:text-[9px] sm:tracking-[0.5em]">
          Scroll to excavate
        </span>
        <span className="h-8 w-px bg-linear-to-b from-foreground/40 to-transparent sm:h-12" />
      </div>
    </section>
  );
}
