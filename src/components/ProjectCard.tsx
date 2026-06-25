'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Flame, Skull } from 'lucide-react';
import { StateBadge } from '@/components/StateBadge';
import { HealthIndicator } from '@/components/HealthIndicator';
import { DecayVisuals } from '@/components/DecayVisuals';
import { useDecayState } from '@/hooks/use-decay-state';
import { formatDate, cn } from '@/lib/utils';
import type { ProjectState } from '@prisma/client';

interface ProjectCardProps {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  state: ProjectState;
  health: number;
  stack: string[];
  screenshots?: string[];
  lastActivityAt?: Date | null;
  createdAt: Date;
  ownerUsername?: string | null;
  likeCount?: number;
  commentCount?: number;
  voteCount?: number;
  viewCount?: number;
  trendingScore?: number;
}

const cardVariants = {
  rest:  { scale: 1 },
  hover: { scale: 1.01, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
};

const STATE_STYLES: Record<ProjectState, { wrapper: string; anim: string }> = {
  BORN:    { wrapper: 'border-blue-500/20 bg-blue-500/5', anim: 'ca-hover-born' },
  ACTIVE:  { wrapper: 'border-emerald-500/20 bg-emerald-500/5', anim: 'ca-hover-active' },
  STALLED: { wrapper: 'border-amber-500/20 bg-amber-500/5', anim: 'ca-hover-stalled' },
  SHIPPED: { wrapper: 'border-teal-500/30 bg-teal-500/5', anim: 'ca-hover-shipped' },
  DEAD:    { wrapper: 'border-border/40 bg-card/20', anim: 'ca-hover-dead' },
};

export const ProjectCard = memo(function ProjectCard({
  slug,
  title,
  description,
  state,
  health,
  stack,
  screenshots = [],
  lastActivityAt,
  createdAt,
  ownerUsername,
  likeCount = 0,
  commentCount = 0,
  voteCount = 0,
  viewCount = 0,
  trendingScore = 0,
}: ProjectCardProps) {
  const { decayState } = useDecayState(health);
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!isHovered || screenshots.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % screenshots.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isHovered, screenshots.length]);

  useEffect(() => {
    if (!isHovered) setCurrentImageIndex(0);
  }, [isHovered]);

  const activityDate = lastActivityAt ?? createdAt;
  const isTrending = trendingScore > 0.5;

  const handleHoverStart = useCallback(() => setIsHovered(true), []);
  const handleHoverEnd   = useCallback(() => setIsHovered(false), []);

  return (
    <DecayVisuals decayState={decayState}>
      <motion.article
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-sm border backdrop-blur-sm transition-colors hover:border-accent/50",
          "h-full min-h-[420px]", // standard grid height
          STATE_STYLES[state].wrapper,
          STATE_STYLES[state].anim
        )}
      >
        {isTrending && (
          <div className="absolute -right-12 top-6 z-10 w-40 rotate-45 bg-accent py-1 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-background shadow-lg">
            Trending
          </div>
        )}

        <Link href={`/project/${slug}`} className="relative aspect-video w-full overflow-hidden bg-black/40">
          {screenshots.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={screenshots[currentImageIndex]}
                alt={`${title} screenshot`}
                className="h-full w-full object-cover opacity-80 transition-opacity hover:opacity-100"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-muted-foreground/30">
              [ NO IMAGE ]
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <Link
              href={`/project/${slug}`}
              className={cn(
                "font-mono text-[13px] font-bold leading-snug transition-colors hover:text-accent",
                state === 'DEAD' ? "text-muted-foreground line-through decoration-destructive/50" : "text-foreground"
              )}
            >
              {title}
            </Link>
            <StateBadge state={state} className="shrink-0" />
          </div>

          <div className="mb-4 h-[40px]">
            {description ? (
              <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mb-4 flex h-[22px] flex-nowrap items-center gap-1.5 overflow-hidden">
            {stack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="min-w-0 shrink truncate rounded-sm border border-border bg-secondary/50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground"
              >
                {tech}
              </span>
            ))}
            {stack.length > 3 && (
              <span className="shrink-0 rounded-sm border border-transparent bg-secondary/30 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/80">
                +{stack.length - 3}
              </span>
            )}
          </div>

          <div className="mb-4 mt-auto">
            <HealthIndicator health={health} showLabel={false} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-y-3 border-t border-border pt-3 font-mono text-[10px] text-muted-foreground/60">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> {likeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {commentCount}
              </span>
              <span className="flex items-center gap-1">
                {voteCount >= 0 ? <Flame className="h-3 w-3" /> : <Skull className="h-3 w-3" />} {Math.abs(voteCount)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                {viewCount}
              </span>
            </div>
            <span>{ownerUsername ? `@${ownerUsername}` : formatDate(activityDate)}</span>
          </div>
        </div>
      </motion.article>
    </DecayVisuals>
  );
});
