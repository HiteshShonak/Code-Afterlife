"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// extend window
declare global {
  interface Window { __lenis?: Lenis; }
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // smooth scroll config
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    });

    // expose to window
    window.__lenis = lenis;

    // sync scroll trigger
    lenis.on("scroll", ScrollTrigger.update);

    // fix scroll warning
    ScrollTrigger.normalizeScroll(true);

    function update(time: number) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  return <>{children}</>;
}
