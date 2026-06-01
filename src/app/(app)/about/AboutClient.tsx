'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { Flame, Code, History } from 'lucide-react';
import { CINEMATIC_EASE } from '@/lib/utils/animation';

// Fade in from bottom slightly
const fadeUp = {
  initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 1.4, ease: CINEMATIC_EASE },
};

const fadeUpStagger = (delay: number) => ({
  initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 1.4, delay, ease: CINEMATIC_EASE },
});

export function AboutClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#030508] text-foreground selection:bg-amber-500/30 selection:text-white overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-slate-900/40 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[900px] w-[900px] rounded-full bg-[#b87333]/5 blur-[200px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-amber-500/5 blur-[200px]" />
      </div>

      <div className="relative z-10">
        
        {/* ── HERO SECTION ── */}
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
          <motion.div
            style={{ opacity: titleOpacity }}
            className="flex flex-col items-center"
          >
            <motion.div {...fadeUpStagger(0)} className="mb-8 flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-amber-500/20" />
              <span className="font-mono text-[10px] font-bold tracking-[0.4em] uppercase text-amber-500/60">
                The Graveyard is Alive
              </span>
              <span className="h-px w-12 bg-amber-500/20" />
            </motion.div>
            
            <motion.h1 
              {...fadeUpStagger(0.2)}
              className="max-w-5xl text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-white/90 drop-shadow-2xl mb-8 leading-[1.05]"
            >
              Software <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-[#b87333]">Never Dies.</span>
            </motion.h1>
            
            <motion.p 
              {...fadeUpStagger(0.4)}
              className="max-w-2xl font-sans text-lg sm:text-xl text-white/40 leading-relaxed mb-16"
            >
              Every side project, every forgotten repository, every abandoned MVP has a pulse. Code Afterlife is the sanctuary for the unfinished, the deprecated, and the resurrected.
            </motion.p>
            
            <motion.div {...fadeUpStagger(0.6)} className="flex items-center gap-1.5 opacity-30 mt-10">
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-white to-transparent" />
            </motion.div>
          </motion.div>
        </section>

        {/* ── MANIFESTO SECTIONS ── */}
        <div className="relative border-y border-white/5 bg-black/40 backdrop-blur-3xl py-32 md:py-48">
          
          <div className="mx-auto max-w-4xl px-6 flex flex-col gap-32 md:gap-48">
            
            {/* Statement 1 */}
            <motion.div {...fadeUp} className="flex flex-col md:flex-row items-start gap-8 md:gap-16">
              <div className="flex-shrink-0 mt-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/30">
                  <Code className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white/90 mb-6">
                  No Code is Dead.
                </h2>
                <p className="text-lg md:text-xl text-white/40 leading-relaxed font-sans max-w-2xl">
                  Even if it hasn't received a commit in 3 years, the logic still exists. The architecture still stands. The ambition that started it is still recorded in the first commit. We celebrate the ghosts of codebases past.
                </p>
              </div>
            </motion.div>

            {/* Statement 2 */}
            <motion.div {...fadeUp} className="flex flex-col md:flex-row items-start gap-8 md:gap-16">
              <div className="flex-shrink-0 mt-2">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                  <Flame className="h-7 w-7 relative z-10" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-[#b87333] mb-6">
                  The Resurrection.
                </h2>
                <p className="text-lg md:text-xl text-white/40 leading-relaxed font-sans max-w-2xl">
                  Projects can be brought back to life. Whether it's a spiritual successor, a direct fork, or a complete rewrite, the lineage continues here. Be a necromancer. Give old code a second life.
                </p>
              </div>
            </motion.div>

            {/* Statement 3 */}
            <motion.div {...fadeUp} className="flex flex-col md:flex-row items-start gap-8 md:gap-16">
              <div className="flex-shrink-0 mt-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/30">
                  <History className="h-7 w-7" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white/90 mb-6">
                  Immutable History.
                </h2>
                <p className="text-lg md:text-xl text-white/40 leading-relaxed font-sans max-w-2xl">
                  We preserve the metadata, the tech stack, and the original vision. It's a museum of ambition, cataloging the evolution of developers around the world as they learn, build, and sometimes abandon their creations.
                </p>
              </div>
            </motion.div>

          </div>
        </div>

        {/* ── CTA OUTRO ── */}
        <section className="relative flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <motion.div {...fadeUp} className="flex flex-col items-center">
            
            <div className="mb-10 flex items-center justify-center">
              <div className="h-24 w-px bg-gradient-to-t from-amber-500/50 to-transparent" />
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white/90 mb-8 max-w-2xl text-balance leading-tight">
              Ready to entomb your latest side project?
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/explore" 
                className="group relative flex items-center justify-center rounded-full bg-amber-500/10 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.15em] text-amber-400 transition-all hover:bg-amber-500/20 hover:scale-105 border border-amber-500/30 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                Explore the Graveyard
              </Link>
              
              <Link 
                href="/dashboard" 
                className="flex items-center justify-center rounded-full bg-white/5 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.15em] text-white/60 transition-all hover:bg-white/10 border border-white/10"
              >
                Dashboard
              </Link>
            </div>
            
          </motion.div>
        </section>
        
      </div>
    </div>
  );
}
