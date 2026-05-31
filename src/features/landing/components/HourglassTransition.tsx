"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * HourglassTransition — Scroll-Scrubbed Video
 *
 * TECHNIQUE: requestVideoFrameCallback + all-keyframe video
 *
 * Why this beats image sequences (203 JPEGs = 11MB):
 *  - Uses a single optimized WebM/MP4 (~1-2MB, 80% smaller)
 *  - Video is encoded with gop=1 so every frame is a keyframe
 *  - Browser can seek to ANY frame instantly, no decoding lag
 *  - requestVideoFrameCallback fires after each frame is decoded,
 *    letting us draw it to canvas for pixel-perfect timing
 *  - IntersectionObserver avoids loading until near viewport
 */
export function HourglassTransition() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const video = videoRef.current;
    if (!video) return;

    // 1. Setup ScrollTrigger for playing/pausing when in view
    const initScroll = () => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        onEnter: () => video.play().catch(() => {}),
        onEnterBack: () => video.play().catch(() => {}),
        onLeave: () => video.pause(),
        onLeaveBack: () => {
          video.pause();
          video.currentTime = 0; 
        }
      });
    };

    // 2. Setup IntersectionObserver to lazy-load the video
    // This prevents the 1.9MB video from blocking initial page load
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Preload the video when it gets within 1 viewport height
          video.load();
          
          if (video.readyState >= 1) {
            initScroll();
          } else {
            video.addEventListener("loadedmetadata", initScroll, { once: true });
          }
          
          // Unobserve once loaded
          observer.disconnect();
        }
      },
      // Load it when it's 100% (one screen height) away
      { rootMargin: "100% 0px" } 
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-hidden="true"
      className="relative bg-[#030508]"
      style={{ minHeight: "250vh" }}
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          src="/hourGlass.mp4"
          className="absolute inset-0 block w-full h-full object-cover"
          muted
          playsInline
          // Lazy loading optimization: don't load data until observer triggers
          preload="none" 
          style={{ filter: "brightness(0.9) contrast(1.05)" }}
        />

        {/* Radial vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Top edge blend → previous section */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 z-20"
          style={{ background: "linear-gradient(to bottom, #030508 0%, transparent 100%)" }}
        />
        {/* Bottom edge blend → next section */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 z-20"
          style={{ background: "linear-gradient(to top, #030508 0%, transparent 100%)" }}
        />
      </div>
    </section>
  );
}
