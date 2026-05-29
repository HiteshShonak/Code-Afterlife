"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// Extend window so TypeScript knows about __lenis
declare global {
  interface Window { __lenis?: Lenis; }
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Cinematic, heavy, delayed smooth scroll
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Classic exponential out
      touchMultiplier: 2,
      infinite: false,
    });

    // Expose on window so Nav (and any other component) can call
    // lenis.scrollTo(element) directly
    window.__lenis = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Fix GSAP "container has a non-static position" warning.
    // When Lenis applies transforms to the scroll container, GSAP loses track
    // of offsets. normalizeScroll(true) tells ScrollTrigger to use native
    // scroll position rather than relying on getBoundingClientRect offsets,
    // which removes the warning entirely without affecting scroll behaviour.
    ScrollTrigger.normalizeScroll(true);

    function update(time: number) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0); // Prevent GSAP from trying to catch up, which breaks Lenis

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  return <>{children}</>;
}
