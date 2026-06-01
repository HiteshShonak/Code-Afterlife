import { Nav } from "@/features/landing/components/Nav";
import { Hero } from "@/features/landing/components/Hero";
import { Lifecycle } from "@/features/landing/components/Lifecycle";
import { Graveyard } from "@/features/landing/components/Graveyard";
import { TimeCapsule } from "@/features/landing/components/TimeCapsule";
import { HourglassTransition } from "@/features/landing/components/HourglassTransition";
import { Legacy } from "@/features/landing/components/Legacy";
import { ProjectPulse } from "@/features/landing/components/ProjectPulse";
import { FinalCta } from "@/features/landing/components/FinalCta";
import { CinematicSpacer } from "@/features/landing/components/CinematicSpacer";
import { Footer } from "@/features/landing/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-foreground">
      <Nav />
      <main>
        <Hero />
        <Lifecycle />
        <Graveyard />
        <TimeCapsule />

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

        <Legacy />

        {/* Legacy → Project Pulse: cold blue fades into deep dark observatory */}
        <CinematicSpacer
          topColor="#030508"
          bottomColor="#040810"
          glowColor="rgba(14,165,233,0.06)"
          height="30vh"
        />

        <ProjectPulse />

        {/* Project Pulse → Final CTA */}
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

