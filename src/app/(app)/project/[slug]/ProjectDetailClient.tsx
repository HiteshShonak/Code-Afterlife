'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Clock, Layers, Heart, MessageSquare, Flame, Bell, BellOff } from 'lucide-react';
import { DecayVisuals } from '@/components/DecayVisuals';
import { HealthIndicator } from '@/components/HealthIndicator';
import { StateBadge } from '@/components/StateBadge';
import { TimelineEntry } from '@/components/TimelineEntry';
import { VoteBar } from '@/components/VoteBar';
import { CommentSection } from '@/components/CommentSection';
import { Button } from '@/components/ui/Button';
import { ResurrectionModal } from '@/components/ResurrectionModal';
import { TimeCapsuleSection } from '@/components/project/TimeCapsuleSection';
import { useDecayState } from '@/hooks/use-decay-state';
import { useLike } from '@/hooks/use-like';
import { useFollow } from '@/hooks/use-follow';
import { shipProjectAction, deleteProjectAction } from '@/actions/project.actions';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import type { ProjectDetail } from '@/types/project';
import type { VoteStats, CommentWithUser } from '@/services/social.service';

interface ProjectDetailClientProps {
  project:          ProjectDetail;
  isOwner:          boolean;
  currentUserId:    string | null;
  initialLiked:     boolean;
  initialFollowing: boolean;
  initialVoteStats: VoteStats;
  initialComments:  CommentWithUser[];
  commentsCursor:   string | null;
}

const STATE_META = {
  BORN:    { label: 'Born',    color: 'oklch(0.60 0.18 240)', tagline: 'Just beginning its journey' },
  ACTIVE:  { label: 'Active',  color: 'oklch(0.60 0.18 150)', tagline: 'Alive and growing' },
  STALLED: { label: 'Stalled', color: 'oklch(0.72 0.14 60)',  tagline: 'No activity for 30+ days' },
  SHIPPED: { label: 'Shipped', color: 'oklch(0.66 0.18 162)', tagline: 'Successfully completed' },
  DEAD:    { label: 'Dead',    color: 'oklch(0.52 0.12 25)',  tagline: 'Abandoned — awaiting resurrection' },
} as const;

/** Stagger animation for sections — delay increments of 0.07s */
const sectionVariant = (delay: number) => ({
  initial:  { opacity: 0, y: 14 },
  animate:  { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function ProjectDetailClient({
  project,
  isOwner,
  currentUserId,
  initialLiked,
  initialFollowing,
  initialVoteStats,
  initialComments,
  commentsCursor,
}: ProjectDetailClientProps) {
  const router              = useRouter();
  const { decayState }      = useDecayState(project.health);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();
  const [isResurrectOpen, setIsResurrectOpen] = useState(false);
  const stateMeta           = STATE_META[project.state];

  // Track view
  useEffect(() => {
    fetch(`/api/projects/${project.id}/view`, { method: 'POST' }).catch(() => {});
  }, [project.id]);

  // Social hooks
  const { liked, likeCount, toggle: toggleLike, isPending: likePending } =
    useLike(project.id, initialLiked, project.likeCount ?? 0);
  const { following, toggle: toggleFollow, isPending: followPending } =
    useFollow(project.id, initialFollowing);

  const isLoggedIn = !!currentUserId;

  const handleShip = () => {
    startTransition(async () => {
      const result = await shipProjectAction(project.id);
      if (!result.success) setActionError(result.message);
      else router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      if (!result.success) setActionError(result.message);
      else router.push('/dashboard');
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="mx-auto max-w-4xl px-6 pt-8 md:px-10">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/explore"
            className="group flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
            Explore
          </Link>
          <span className="font-mono text-[10px] text-muted-foreground/30">/</span>
          <span className="max-w-xs truncate font-mono text-[10px] text-muted-foreground/60">
            {project.title}
          </span>
        </div>
      </div>

      <DecayVisuals decayState={decayState}>
        <main className="mx-auto max-w-4xl px-6 pb-32 md:px-10">

          {/* ── Resurrection Banner ────────────────────────────── */}
          {project.lineageDepth > 0 && project.parentProject && (
            <motion.div {...sectionVariant(0)} className="mb-6 sticky top-4 z-20">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-[#0a1a12] px-4 py-3 font-mono text-[11px] text-emerald-400 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <span className="text-emerald-500/70">↑</span>
                <span>
                  Resurrected from{' '}
                  <Link href={`/project/${project.parentProject.slug}`} className="font-bold underline-offset-2 hover:text-emerald-300 transition-colors">
                    {project.parentProject.title}
                  </Link>
                  {' '}by @{project.resurrecter?.username ?? 'unknown'}
                </span>
              </div>
            </motion.div>
          )}

          {/* ── Hero Header ─────────────────────────────────────── */}
          <motion.div {...sectionVariant(0.02)} className="mb-10">
            {/* State tagline */}
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em]"
               style={{ color: stateMeta.color }}>
              {stateMeta.tagline}
            </p>

            {/* Massive Cover Image */}
            {project.screenshots && project.screenshots.length > 0 && (
              <div className="mb-6 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative">
                <img 
                  src={project.screenshots[0]} 
                  alt={`${project.title} cover`} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <h1 className="font-mono text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-foreground">
                {project.title}
              </h1>
              <div className="flex flex-shrink-0 items-center gap-2 mt-2">
                <StateBadge state={project.state} />
              </div>
            </div>

            {project.description && (
              <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-muted-foreground/90 font-sans">
                {project.description}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-muted-foreground/60">
              <span className="flex items-center gap-1.5">
                <span className="text-accent/70">by</span>
                <Link href={`/u/${project.user.username ?? project.user.id}`} className="hover:text-accent transition-colors">
                  @{project.user.username ?? project.user.name ?? 'unknown'}
                </Link>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatDate(project.createdAt)}
              </span>
              {project.lastActivityAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Last active {formatRelativeDate(project.lastActivityAt)}
                </span>
              )}
              {project.lineageDepth > 0 && (
                <span className="flex items-center gap-1.5 text-accent">
                  <Layers className="h-3 w-3" />
                  Lineage depth {project.lineageDepth}
                </span>
              )}
            </div>

            {/* Lineage Breadcrumb Preview */}
            {(project.parentProject || project.children.length > 0) && (
              <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-muted-foreground/40">
                <Layers className="h-3 w-3" />
                {project.parentProject && (
                  <>
                    <Link href={`/project/${project.parentProject.slug}`} className="hover:text-muted-foreground">Original</Link>
                    <span>→</span>
                  </>
                )}
                <span className="text-foreground/70">Current</span>
                {project.children.length > 0 && (
                  <>
                    <span>→</span>
                    <Link href={`/project/${project.children[0].slug}`} className="hover:text-muted-foreground">Next Gen</Link>
                  </>
                )}
              </div>
            )}

            {/* Social action bar */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {/* Like button */}
              <button
                onClick={() => isLoggedIn ? toggleLike() : (window.location.href = '/')}
                disabled={likePending}
                className={[
                  'flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-[12px] font-medium transition-all duration-200',
                  liked
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                    : 'border-border/60 bg-card/60 text-muted-foreground hover:border-rose-500/30 hover:text-rose-400',
                  likePending ? 'cursor-not-allowed opacity-60' : '',
                ].join(' ')}
                aria-label={liked ? 'Unlike project' : 'Like project'}
              >
                <Heart className={['h-4 w-4 transition-all', liked ? 'fill-rose-400 text-rose-400' : ''].join(' ')} />
                <span>{likeCount}</span>
              </button>

              {/* Comment count (scroll hint) */}
              <a
                href="#comments"
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2 font-mono text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{project.commentCount ?? 0}</span>
              </a>

              {/* Vote count */}
              <span className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2 font-mono text-[12px] text-muted-foreground/60">
                <Flame className="h-4 w-4" />
                <span>{project.voteCount ?? 0}</span>
              </span>

              {/* Follow button / It's you badge */}
              {isOwner ? (
                <div className="ml-auto flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2 font-mono text-[12px] font-medium text-accent">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  It's you
                </div>
              ) : (
                <button
                  onClick={() => isLoggedIn ? toggleFollow() : (window.location.href = '/')}
                  disabled={followPending}
                  className={[
                    'ml-auto flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-[12px] font-medium transition-all duration-200',
                    following
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-border/60 bg-card/60 text-muted-foreground hover:border-accent/30 hover:text-accent',
                    followPending ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {following ? (
                    <><BellOff className="h-4 w-4" /> Unfollow</>
                  ) : (
                    <><Bell className="h-4 w-4" /> Follow</>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Time Capsule ────────────────────────────────────── */}
          <motion.section {...sectionVariant(0.05)} className="mb-10">
            <TimeCapsuleSection
              projectId={project.id}
              isOwner={isOwner}
              state={project.state}
              initialTestament={project.testament}
              initialTimeCapsule={project.timeCapsule}
            />
          </motion.section>

          {/* ── Health ──────────────────────────────────────────── */}
          <motion.section {...sectionVariant(0.07)}
            className="mb-8 rounded-2xl border border-foreground/[0.08] bg-card/60 p-6 backdrop-blur-sm">
            <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Project Health
            </h2>
            <HealthIndicator health={project.health} showLabel showStateLabel className="max-w-sm" />
          </motion.section>

          {/* ── Community Vote ───────────────────────────────────── */}
          <motion.section {...sectionVariant(0.1)}
            className="mb-8 rounded-2xl border border-foreground/[0.08] bg-card/60 p-6 backdrop-blur-sm">
            <h2 className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Community Prediction
            </h2>
            <VoteBar
              projectId={project.id}
              initialStats={initialVoteStats}
              isLoggedIn={isLoggedIn}
            />
          </motion.section>

          {/* ── Screenshots ─────────────────────────────────────── */}
          {project.screenshots && project.screenshots.length > 1 && (
            <motion.section {...sectionVariant(0.13)} className="mb-8">
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Additional Screenshots
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {project.screenshots.slice(1).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                     className="group aspect-video overflow-hidden rounded-xl border border-white/[0.06] bg-black/30">
                    <img
                      src={url}
                      alt={`${project.title} screenshot ${i + 2}`}
                      className="h-full w-full object-cover opacity-80 transition-all duration-300 group-hover:scale-[1.02] group-hover:opacity-100"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </a>
                ))}
              </div>
            </motion.section>
          )}

          {/* ── Stack ───────────────────────────────────────────── */}
          {project.stack.length > 0 && (
            <motion.section {...sectionVariant(0.16)} className="mb-8">
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <Layers className="h-3 w-3" /> Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span key={tech}
                    className="rounded-lg border border-foreground/[0.1] bg-foreground/[0.04] px-3 py-1.5 font-mono text-[11px] tracking-wide text-muted-foreground">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.section>
          )}

          {/* ── GitHub link ─────────────────────────────────────── */}
          {project.githubRepoUrl && (
            <motion.div {...sectionVariant(0.18)} className="mb-8">
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-xl border border-foreground/[0.1] bg-foreground/[0.03] px-4 py-3 font-mono text-[12px] text-muted-foreground transition-all hover:border-foreground/20 hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                View on GitHub
                <span className="ml-1 text-muted-foreground/40 group-hover:text-muted-foreground/70">↗</span>
              </a>
            </motion.div>
          )}

          {/* ── Lineage ─────────────────────────────────────────── */}
          {(project.parentProject || project.children.length > 0) && (
            <motion.section {...sectionVariant(0.2)}
              className="mb-8 rounded-2xl border border-foreground/[0.08] bg-card/60 p-6">
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Lineage
              </h2>
              {project.parentProject && (
                <div className="mb-3 flex items-center gap-2 font-mono text-[12px] text-muted-foreground">
                  <span className="text-accent/70">↑</span>
                  <span>Resurrected from</span>
                  <Link href={`/project/${project.parentProject.slug}`}
                        className="text-foreground underline-offset-2 hover:underline">
                    {project.parentProject.title}
                  </Link>
                </div>
              )}
              {project.children.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-muted-foreground">
                  <span className="text-emerald-400/70">↓</span>
                  <span>Resurrected as</span>
                  {project.children.map((child) => (
                    <Link key={child.id} href={`/project/${child.slug}`}
                          className="text-foreground underline-offset-2 hover:underline">
                      {child.title}
                    </Link>
                  ))}
                </div>
              )}
              <Link
                href={`/lineage/${project.slug}`}
                className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-accent/60 transition-colors hover:text-accent"
              >
                View Lineage Graph →
              </Link>
            </motion.section>
          )}

          {/* ── Timeline ────────────────────────────────────────── */}
          <motion.section {...sectionVariant(0.23)} className="mb-8">
            <h2 className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Timeline
            </h2>
            {project.timelineEntries && project.timelineEntries.length > 0 ? (
              <ul>
                {project.timelineEntries.map((entry, i) => (
                  <TimelineEntry
                    key={entry.id}
                    type={entry.type}
                    title={entry.title}
                    description={entry.description}
                    createdAt={entry.createdAt}
                    index={i}
                  />
                ))}
              </ul>
            ) : (
              <p className="font-mono text-[12px] text-muted-foreground/40">
                No timeline entries yet. Activity will appear here.
              </p>
            )}
          </motion.section>

          {/* ── Owner Actions ────────────────────────────────────── */}
          {isOwner && project.state !== 'SHIPPED' && project.state !== 'DEAD' && (
            <motion.section {...sectionVariant(0.26)}
              className="mb-8 rounded-2xl border border-foreground/[0.08] p-6">
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                Owner Actions
              </h2>
              {actionError && (
                <p className="mb-3 font-mono text-[11px] text-destructive">{actionError}</p>
              )}
              <div className="flex gap-3">
                {project.state === 'ACTIVE' && (
                  <Button variant="outline" size="sm" onClick={handleShip} isLoading={isPending}>
                    Mark as Shipped ✓
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isPending}>
                  Archive as Dead
                </Button>
              </div>
            </motion.section>
          )}

          {/* ── Resurrection CTA (For visitors on DEAD projects) ── */}
          {!isOwner && project.state === 'DEAD' && isLoggedIn && (
            <motion.section {...sectionVariant(0.28)} className="mb-8 overflow-hidden relative rounded-2xl border border-emerald-500/20 bg-[#06120c] p-8 text-center backdrop-blur-sm">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)] blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <h2 className="mb-2 font-mono text-[18px] font-bold text-emerald-400">
                  This project is dead.
                </h2>
                <p className="mb-6 font-mono text-[12px] text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">
                  But software never dies. You can resurrect this code, inherit its legacy, and give it a second life.
                </p>
                <Button onClick={() => setIsResurrectOpen(true)} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-105">
                  <Flame className="mr-2 h-4 w-4" /> Resurrect This Project
                </Button>
              </div>
              <ResurrectionModal 
                open={isResurrectOpen} 
                onClose={() => setIsResurrectOpen(false)} 
                deadProject={project as any} 
              />
            </motion.section>
          )}

          {/* ── Comments ─────────────────────────────────────────── */}
          <motion.section {...sectionVariant(0.3)} id="comments" className="mb-8">
            <h2 className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Discussion
            </h2>
            <CommentSection
              projectId={project.id}
              initialComments={initialComments}
              nextCursor={commentsCursor}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
            />
          </motion.section>
        </main>
      </DecayVisuals>
    </div>
  );
}
