'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Crown, Flame, MessageSquare, ExternalLink, Heart } from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';
import { formatDate } from '@/lib/utils';
import type { ProjectWithUser } from '@/types/project';

interface LegacyClientProps {
  projects: ProjectWithUser[];
  currentUserId: string | null;
}

const CINEMATIC_EASE = [0.16, 1, 0.3, 1] as const;

export function LegacyClient({ projects, currentUserId }: LegacyClientProps) {
  return (
    <div className="relative min-h-screen bg-[#050403] text-foreground selection:bg-amber-500/30">
      {/* ── ATMOSPHERE ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)]" />
      </div>

      {/* Floating golden dust */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-amber-400/30"
            style={{
              left: `${10 + (i * 37) % 80}%`,
              bottom: `${(i * 19) % 80}%`,
              width: 1 + (i % 3) * 0.8,
              height: 1 + (i % 3) * 0.8,
              boxShadow: '0 0 10px 2px rgba(245, 158, 11, 0.2)',
            }}
            animate={{ y: [0, -(40 + (i % 5) * 20), 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 10 + (i * 1.5) % 15, delay: (i * 0.5) % 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-10 mx-auto max-w-6xl px-6 pt-16 md:px-10 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: CINEMATIC_EASE }}
          className="mb-12 flex items-center gap-4"
        >
          <Link
            href="/explore"
            className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-500/50 transition-colors hover:text-amber-500"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to Explore
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.5, delay: 0.2, ease: CINEMATIC_EASE }}
          className="mb-24 flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <Crown className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="mb-4 font-mono text-4xl font-extrabold tracking-tight text-amber-50 md:text-6xl lg:text-7xl">
            Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">Legacy</span>
          </h1>
          <p className="max-w-2xl font-mono text-[13px] leading-relaxed text-amber-500/60 md:text-[15px]">
            They fought through the stall. They survived the architecture rewrites. They shipped.
            <br className="hidden md:block" />
            These are the projects that crossed the finish line.
          </p>
        </motion.div>
      </header>

      {/* ── GRID ── */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-32 md:px-10">
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <Crown className="mb-4 h-8 w-8 text-amber-500/20" />
            <p className="font-mono text-[12px] uppercase tracking-widest text-amber-500/40">
              The hall is empty. Be the first to ship.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: CINEMATIC_EASE }}
                className="group relative"
              >
                {/* Intense glowing golden wrapper */}
                <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-amber-400/40 to-transparent opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className="relative h-full overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0a0705] transition-all duration-500 hover:border-amber-500/50 hover:bg-[#120b06]">
                  {/* Image */}
                  {project.screenshots?.[0] ? (
                    <div className="aspect-video w-full overflow-hidden border-b border-amber-500/20 relative">
                      <div className="absolute inset-0 bg-amber-500/10 mix-blend-color z-10 transition-opacity duration-500 group-hover:opacity-0" />
                      <img
                        src={project.screenshots[0]}
                        alt={project.title}
                        className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center border-b border-amber-500/20 bg-amber-500/5">
                      <Crown className="h-8 w-8 text-amber-500/20" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-amber-500/80 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                        Shipped
                      </span>
                      <span className="font-mono text-[9px] text-amber-500/40">
                        {formatDate(project.createdAt)}
                      </span>
                    </div>

                    <h2 className="mb-2 font-mono text-xl font-bold tracking-tight text-amber-50 transition-colors group-hover:text-amber-400">
                      <Link href={`/project/${project.slug}`} className="before:absolute before:inset-0">
                        {project.title}
                      </Link>
                    </h2>

                    <p className="line-clamp-2 font-sans text-sm text-amber-50/50">
                      {project.description || 'No description provided.'}
                    </p>

                    {/* Meta row */}
                    <div className="mt-5 flex items-center justify-between border-t border-amber-500/10 pt-4">
                      <span className="font-mono text-[10px] text-amber-500/50">
                        @{project.user.username ?? project.user.name ?? 'unknown'}
                      </span>

                      <div className="flex items-center gap-3 font-mono text-[10px] text-amber-500/60">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {project.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {project.commentCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          {project.viewCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
