"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// extend window
declare global {
  interface Window { __lenis?: Lenis; }
}

const DESKTOP_SMOOTH_SCROLL_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const [smoothScrollEnabled, setSmoothScrollEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const desktopQuery = window.matchMedia(DESKTOP_SMOOTH_SCROLL_QUERY);
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const updatePreference = () => {
      setSmoothScrollEnabled(desktopQuery.matches && !reducedMotionQuery.matches);
    };

    updatePreference();
    desktopQuery.addEventListener("change", updatePreference);
    reducedMotionQuery.addEventListener("change", updatePreference);

    return () => {
      desktopQuery.removeEventListener("change", updatePreference);
      reducedMotionQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    ScrollTrigger.normalizeScroll(false);

    if (!smoothScrollEnabled) {
      window.__lenis = undefined;
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
      infinite: false,
      stopInertiaOnNavigate: true,
    });

    lenisRef.current = lenis;
    window.__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    function update(time: number) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
      if (lenisRef.current === lenis) {
        lenisRef.current = null;
      }
      if (window.__lenis === lenis) {
        window.__lenis = undefined;
      }
    };
  }, [smoothScrollEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      lenisRef.current?.resize();
      ScrollTrigger.refresh();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [pathname, smoothScrollEnabled]);

  return <>{children}</>;
}
