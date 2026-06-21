import dynamic from "next/dynamic";
import { Nav } from "@/features/landing/components/Nav";
import { Hero } from "@/features/landing/components/Hero";

// Below-fold sections - code-split via next/dynamic.
// Their HTML still renders on the server (SSR preserved), but JS is deferred,
// reducing the initial bundle that causes the 5.0s main-thread parse cost.
const Lifecycle          = dynamic(() => import("@/features/landing/components/Lifecycle").then(m => m.Lifecycle));
const Graveyard          = dynamic(() => import("@/features/landing/components/Graveyard").then(m => m.Graveyard));
const TimeCapsule        = dynamic(() => import("@/features/landing/components/TimeCapsule").then(m => m.TimeCapsule));
const HourglassTransition = dynamic(() => import("@/features/landing/components/HourglassTransition").then(m => m.HourglassTransition));
const Legacy             = dynamic(() => import("@/features/landing/components/Legacy").then(m => m.Legacy));
const ProjectPulse       = dynamic(() => import("@/features/landing/components/ProjectPulse").then(m => m.ProjectPulse));
const FinalCta           = dynamic(() => import("@/features/landing/components/FinalCta").then(m => m.FinalCta));
const CinematicSpacer    = dynamic(() => import("@/features/landing/components/CinematicSpacer").then(m => m.CinematicSpacer));
const Footer             = dynamic(() => import("@/features/landing/components/Footer").then(m => m.Footer));


export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-foreground">
      <Nav />
      <main>
        <Hero />
        <Lifecycle />
        <Graveyard />
        <TimeCapsule />

        {/* hourglass + its spacers — hidden entirely on mobile, shown on md+ */}
        <div className="hidden md:block">
          <CinematicSpacer
            topColor="var(--background)"
            bottomColor="#030508"
            glowColor="rgba(200,120,30,0.12)"
            height="45vh"
          />

          <HourglassTransition />

          <CinematicSpacer
            topColor="#030508"
            bottomColor="#030508"
            glowColor="rgba(56,189,248,0.12)"
            height="45vh"
          />
        </div>

        <Legacy />

        {/* transition 1 */}
        <CinematicSpacer
          topColor="#030508"
          bottomColor="#040810"
          glowColor="rgba(14,165,233,0.06)"
          height="30vh"
        />

        <ProjectPulse />

        {/* transition 2 */}
        <CinematicSpacer
          topColor="#0a0a0f"
          bottomColor="var(--background)"
          glowColor="rgba(14,165,233,0.05)"
          height="25vh"
        />

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

