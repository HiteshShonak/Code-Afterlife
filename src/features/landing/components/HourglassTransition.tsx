"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// hourglass video transition
export function HourglassTransition() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const video = videoRef.current;
    if (!video) return;

    // setup scroll trigger
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

    // setup intersection observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // preload video
          video.load();
          
          if (video.readyState >= 1) {
            initScroll();
          } else {
            video.addEventListener("loadedmetadata", initScroll, { once: true });
          }
          
          // unobserve
          observer.disconnect();
        }
      },
      // root margin
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
          // lazy load
          preload="none" 
          style={{ filter: "brightness(0.9) contrast(1.05)" }}
        />

        {/* vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* top blend */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 z-20"
          style={{ background: "linear-gradient(to bottom, #030508 0%, transparent 100%)" }}
        />
        {/* bottom blend */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 z-20"
          style={{ background: "linear-gradient(to top, #030508 0%, transparent 100%)" }}
        />
      </div>
    </section>
  );
}
