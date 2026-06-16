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

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const animate = () => {
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

    window.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="relative isolate flex h-screen min-h-[760px] w-full flex-col items-center justify-center overflow-hidden">
      {/* background image */}
      <div className="absolute inset-0 -z-30 bg-background overflow-hidden">
        {/* inner background */}
        <div ref={bgRef} className="absolute -inset-[5%] -translate-x-[1%]">
          <Image
            src="/hero-image.webp"
            alt="A vast foggy ravine of digital ruins with floating abandoned software panels and a distant light beam on the horizon"
            fill
            priority
            sizes="100vw"
            className="ca-ken-burns h-full w-full object-cover object-[52%_center] select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

      <Particles />

      {/* fog layers */}
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        {/* deep background fog */}
        <div className="absolute bottom-0 left-[-20%] h-[80%] w-[140%] ca-fog-drift-1 bg-gradient-to-t from-background via-accent/10 to-transparent blur-3xl opacity-80 mix-blend-screen" />
        {/* foreground fog */}
        <div className="absolute bottom-[-10%] left-[-10%] h-[60%] w-[120%] ca-fog-drift-2 bg-gradient-to-t from-background via-background/80 to-transparent blur-2xl opacity-90" />
      </div>

      {/* panels */}
      <div className="pointer-events-none absolute inset-0 -z-10 [perspective:1000px]">
        <div ref={panelsRef} className="absolute inset-0">
          {/* panel 1 */}
          <div 
            className="absolute left-[12%] top-[30%] w-48 h-64 border border-accent/20 bg-background/5 backdrop-blur-md rounded-2xl ca-panel-float shadow-[0_0_30px_rgba(139,92,246,0.1)] opacity-70"
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
            className="absolute right-[8%] top-[50%] w-64 h-44 border border-white/10 bg-background/10 backdrop-blur-lg rounded-2xl ca-panel-float shadow-[0_0_20px_rgba(255,255,255,0.05)] opacity-50"
            style={{ "--tw-panel-rx": "-15deg", "--tw-panel-ry": "-35deg", "--tw-panel-duration": "24s" } as React.CSSProperties}
          >
            <div className="w-full h-full p-4 flex flex-col gap-2 opacity-30">
              <div className="h-[2px] w-full bg-white/40 rounded-full mb-3" />
              <div className="h-[2px] w-full bg-white/20 rounded-full" />
              <div className="h-[2px] w-4/5 bg-white/20 rounded-full" />
              <div className="h-[2px] w-5/6 bg-white/20 rounded-full" />
              <div className="h-[2px] w-1/2 bg-white/20 rounded-full mt-auto" />
            </div>
          </div>

          {/* panel 3 */}
          <div 
            className="absolute right-[30%] top-[15%] w-32 h-32 border border-accent/10 bg-accent/5 backdrop-blur-sm rounded-xl ca-panel-float opacity-30 blur-[3px]"
            style={{ "--tw-panel-rx": "5deg", "--tw-panel-ry": "15deg", "--tw-panel-duration": "32s" } as React.CSSProperties}
          />
        </div>
      </div>

      {/* lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent via-background/80 to-background" />
        <div className="ca-pulse-glow absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 mix-blend-screen" />
        <div className="ca-grain absolute inset-0 opacity-40 mix-blend-overlay" />
        {/* text shadow */}
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[1100px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <h1 className="text-balance font-sans text-[14vw] font-extrabold leading-[0.86] tracking-[-0.045em] text-foreground md:text-[9.5rem]">
          Software
          <br />
          Never Dies.
        </h1>
        <p className="mx-auto mt-8 max-w-[44ch] text-pretty font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground md:text-sm">
          Projects decay. Builders disappear. Code survives.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
          <Link
            href="/graveyard"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-background transition-colors duration-500 hover:bg-accent hover:text-accent-foreground"
          >
            Enter the Graveyard
            <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors duration-500 hover:bg-foreground/5"
          >
            Explore Projects
          </Link>
        </div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-muted-foreground">
          Scroll to excavate
        </span>
        <span className="h-12 w-px bg-gradient-to-b from-foreground/40 to-transparent" />
      </div>
    </section>
  );
}
