'use client';

import { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Flame } from 'lucide-react';
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
  trendingScore?: number;
}

const cardVariants = {
  rest:  { scale: 1 },
  hover: { scale: 1.01, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Reusable project card. Features a screenshot carousel on hover,
 * decay visual effects, health bar, and social stats.
 */
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
  trendingScore = 0,
}: ProjectCardProps) {
  const { decayState } = useDecayState(health);
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-cycle screenshots when hovered
  useEffect(() => {
    if (!isHovered || screenshots.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % screenshots.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isHovered, screenshots.length]);

  // Reset index when mouse leaves
  useEffect(() => {
    if (!isHovered) setCurrentImageIndex(0);
  }, [isHovered]);

  const activityDate = lastActivityAt ?? createdAt;
  const isTrending = trendingScore > 0.5;

  const DECAY_GLOW: Record<string, string> = {
    thriving:  'rgba(110,231,183,0.08)',
    stable:    'rgba(103,232,249,0.06)',
    unstable:  'rgba(251,191,36,0.06)',
    nearDeath: 'rgba(248,113,113,0.06)',
    dead:      'transparent',
  };

  return (
    <DecayVisuals decayState={decayState}>
      <motion.article
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card/60 backdrop-blur-sm transition-colors hover:border-accent/30"
        style={{ boxShadow: `inset 0 0 40px ${DECAY_GLOW[decayState]}` }}
      >
        {/* Trending Ribbon */}
        {isTrending && (
          <div className="absolute -right-12 top-6 z-10 w-40 rotate-45 bg-accent py-1 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-background shadow-lg">
            Trending
          </div>
        )}

        {/* Screenshot Header */}
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
          {/* Header row */}
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
            <StateBadge state={state} className="flex-shrink-0" />
          </div>

          {/* Description */}
          {description && (
            <p className="mb-4 line-clamp-2 flex-1 text-[12px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          {/* Stack tags */}
          {stack.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {stack.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="rounded-sm border border-border bg-secondary/50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
              {stack.length > 4 && (
                <span className="font-mono text-[9px] text-muted-foreground/60">
                  +{stack.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Health bar */}
          <div className="mb-4 mt-auto">
            <HealthIndicator health={health} showLabel={false} />
          </div>

          {/* Footer row: Socials + Time */}
          <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-[10px] text-muted-foreground/60">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> {likeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {commentCount}
              </span>
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3" /> {voteCount}
              </span>
            </div>
            <span>{ownerUsername ? `@${ownerUsername}` : formatDate(activityDate)}</span>
          </div>
        </div>
      </motion.article>
    </DecayVisuals>
  );
});
