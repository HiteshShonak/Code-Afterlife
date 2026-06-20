'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, Clock, Layers, Heart, MessageSquare, Flame, Bell, BellOff, LockOpen, Plus, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { DecayVisuals } from '@/components/DecayVisuals';
import { HealthIndicator } from '@/components/HealthIndicator';
import { StateBadge } from '@/components/StateBadge';
import { TimelineEntry } from '@/components/TimelineEntry';
import { VoteBar } from '@/components/VoteBar';
import { CommentSection } from '@/components/CommentSection';
import { ProjectChatbot } from '@/components/project/ProjectChatbot';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ResurrectionModal } from '@/components/ResurrectionModal';
import { ArchiveProjectModal } from '@/components/ArchiveProjectModal';
import { TimeCapsuleSection } from '@/components/project/TimeCapsuleSection';
import { useDecayState } from '@/hooks/use-decay-state';
import { useLike } from '@/hooks/use-like';
import { useFollow } from '@/hooks/use-follow';
import { shipProjectAction, permanentDeleteProjectAction } from '@/actions/project.actions';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import type { ProjectDetail } from '@/types/project';
import type { VoteStats, CommentWithUser } from '@/services/social.service';
import { ImageLightbox } from '@/components/ImageLightbox';

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
  STALLED: { label: 'Stalled', color: 'oklch(0.72 0.14 60)',  tagline: 'No activity for 1+ day' },
  SHIPPED: { label: 'Shipped', color: 'oklch(0.66 0.18 162)', tagline: 'Successfully completed' },
  DEAD:    { label: 'Dead',    color: 'oklch(0.52 0.12 25)',  tagline: 'Abandoned - awaiting resurrection' },
} as const;

// stagger animation
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

  // Track view - AbortController ensures no double-fire on unmount
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/projects/${project.id}/view`, { method: 'POST', signal: ctrl.signal }).catch(() => {});
    return () => ctrl.abort();
  }, [project.id]);

  // Social hooks
  const { liked, likeCount, toggle: toggleLike, isPending: likePending } =
    useLike(project.id, initialLiked, project.likeCount ?? 0);
  const { following, followerCount, toggle: toggleFollow, isPending: followPending } =
    useFollow(project.id, initialFollowing, project._count?.followers ?? 0);

  const isLoggedIn = !!currentUserId;
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // lightbox state for screenshot gallery
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const screenshots = project.screenshots ?? [];
  const hasScreenshots = screenshots.length > 0;

  // Manual Update Modal State
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateMethod, setUpdateMethod] = useState<'MANUAL' | 'AI'>('MANUAL');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [isUpdatingTimeline, setIsUpdatingTimeline] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const handleShip = () => {
    startTransition(async () => {
      const result = await shipProjectAction(project.id);
      if (!result.success) setActionError(result.message);
      else router.refresh();
    });
  };

  const handleDelete = () => {
    // Open the archive modal so the user can write an epitaph
    setArchiveModalOpen(true);
  };

  const handlePermanentDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmPermanentDelete = () => {
    startTransition(async () => {
      const result = await permanentDeleteProjectAction(project.id);
      if (!result.success) setActionError(result.message);
      else {
        router.push('/dashboard');
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && hasScreenshots && (
          <ImageLightbox
            images={screenshots}
            startIndex={lightboxIndex}
            projectTitle={project.title}
            projectSlug={project.slug}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
      {/* Permanent Delete Modal */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => { if (!isPending) setIsDeleteConfirmOpen(false); }}
        title="Delete Project"
        description="Are you sure you want to permanently delete this project? This action cannot be undone and will remove all comments, likes, and timeline entries."
      >
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmPermanentDelete}
            isLoading={isPending}
            className="w-auto px-6 h-9"
          >
            {isPending ? 'Deleting...' : 'Delete Project'}
          </Button>
        </div>
      </Dialog>

      {/* Archive epitaph modal */}
      <ArchiveProjectModal
        open={archiveModalOpen}
        projectId={project.id}
        projectTitle={project.title}
        onClose={() => setArchiveModalOpen(false)}
        onArchived={() => router.push('/dashboard')}
      />

      {/* Manual Update Modal */}
      <Dialog
        open={updateModalOpen}
        onClose={() => { if (!isUpdatingTimeline) setUpdateModalOpen(false); }}
        title="Log Update"
        description="Add a milestone to the timeline. You can only do this once every 24 hours."
      >
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => { setUpdateMethod('MANUAL'); setUpdateError(''); }}
              className={`flex-1 rounded border px-3 py-1.5 font-mono text-[10px] uppercase transition-colors ${updateMethod === 'MANUAL' ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border/50 bg-background/50 text-muted-foreground/60 hover:text-foreground'}`}
            >
              Manual Post
            </button>
            <button
              onClick={() => { setUpdateMethod('AI'); setUpdateError(''); }}
              className={`flex-1 rounded border px-3 py-1.5 font-mono text-[10px] uppercase transition-colors ${updateMethod === 'AI' ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border/50 bg-background/50 text-muted-foreground/60 hover:text-foreground'}`}
            >
              AI Fetch from GitHub
            </button>
          </div>

          {updateMethod === 'MANUAL' ? (
            <>
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Title</label>
                <input
                  type="text"
                  value={updateTitle}
                  onChange={e => setUpdateTitle(e.target.value)}
                  placeholder="e.g. Finally fixed the auth bug"
                  className="w-full rounded border border-border/50 bg-background/50 px-3 py-2 font-mono text-xs outline-none focus:border-accent/50"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Description (Optional)</label>
                <textarea
                  value={updateDescription}
                  onChange={e => setUpdateDescription(e.target.value)}
                  placeholder="Add more details about this update..."
                  className="w-full min-h-[80px] resize-y rounded border border-border/50 bg-background/50 px-3 py-2 font-mono text-xs outline-none focus:border-accent/50"
                  maxLength={300}
                />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-accent/20 bg-accent/5 p-6 text-center">
              <Flame className="mx-auto mb-3 h-6 w-6 text-accent/50" />
              <p className="mb-1 font-mono text-xs text-accent/80">Trigger AI Pulse</p>
              <p className="font-mono text-[10px] text-muted-foreground/60">
                This will force an immediate fetch from GitHub. Our AI will analyze your latest commits and write a cinematic summary.
              </p>
            </div>
          )}

          {updateError && (
            <p className="font-mono text-[10px] text-red-500/80">{updateError}</p>
          )}
          
          <div className="mt-4 flex justify-end gap-3 border-t border-border/40 pt-4">
            <Button variant="ghost" onClick={() => setUpdateModalOpen(false)} disabled={isUpdatingTimeline}>Cancel</Button>
            <Button 
              onClick={async () => {
                if (updateMethod === 'MANUAL' && !updateTitle.trim()) {
                  setUpdateError('Title is required.');
                  return;
                }
                setIsUpdatingTimeline(true);
                setUpdateError('');
                try {
                  const endpoint = updateMethod === 'MANUAL' 
                    ? `/api/projects/${project.id}/timeline` 
                    : `/api/projects/${project.id}/ai-pulse`;
                  
                  const payload = updateMethod === 'MANUAL'
                    ? { title: updateTitle, description: updateDescription }
                    : {}; // AI pulse doesn't need payload

                  const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'Failed to post update');
                  
                  setUpdateModalOpen(false);
                  setUpdateTitle('');
                  setUpdateDescription('');
                  router.refresh();
                } catch (err: any) {
                  setUpdateError(err.message);
                } finally {
                  setIsUpdatingTimeline(false);
                }
              }}
              isLoading={isUpdatingTimeline}
              disabled={isUpdatingTimeline || (updateMethod === 'MANUAL' && !updateTitle.trim())}
              className="bg-accent/20 text-accent hover:bg-accent/30"
            >
              {updateMethod === 'MANUAL' ? 'Post Update' : 'Trigger AI'}
            </Button>
          </div>
        </div>
      </Dialog>
      {/* Back nav */}
      <div className="mx-auto max-w-4xl px-6 pt-8 md:px-10">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/explore"
            className="group flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Explore
          </Link>
          <span className="font-mono text-xs text-muted-foreground/30">/</span>
          <span className="max-w-xs truncate font-mono text-xs text-muted-foreground/60">
            {project.title}
          </span>
        </div>
      </div>

      <DecayVisuals decayState={decayState}>
        <main className="mx-auto max-w-4xl px-6 pb-32 md:px-10">

          {/* ── Resurrection Banner ────────────────────────────── */}
          {project.lineageDepth > 0 && project.parentProject && (
            <motion.div {...sectionVariant(0)} className="mb-6 sticky top-4 z-20">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-[#0a1a12] px-4 py-3 font-mono text-xs text-emerald-400 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <span className="text-emerald-500/70">↑</span>
                <span>
                  Resurrected from{' '}
                  <Link href={`/project/${project.parentProject.slug}`} className="font-bold underline-offset-2 hover:text-emerald-300 transition-colors">
                    {project.parentProject.title}
                  </Link>
                  {' '}by @{project.parentProject.user?.username ?? 'unknown'}
                </span>
              </div>
            </motion.div>
          )}

          {/* ── Hero Header ─────────────────────────────────────── */}
          <motion.div {...sectionVariant(0.02)} className="mb-10">
            {/* State tagline */}
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] font-medium"
               style={{ color: stateMeta.color }}>
              {stateMeta.tagline}
            </p>

            {/* Screenshot Gallery */}
            {hasScreenshots && (
              <div className="mb-6">
                {/* Main image - click to zoom */}
                <div
                  className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl cursor-zoom-in group"
                  onClick={() => setLightboxIndex(galleryIndex)}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.img
                      key={galleryIndex}
                      src={screenshots[galleryIndex]}
                      alt={`${project.title} screenshot ${galleryIndex + 1}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-70 pointer-events-none" />
                  {/* Zoom hint */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/50 px-2.5 py-1.5 font-mono text-[10px] text-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ZoomIn className="h-3 w-3" />
                    Click to zoom
                  </div>
                  {/* Count badge when multiple */}
                  {screenshots.length > 1 && (
                    <div className="absolute bottom-3 right-3 rounded-lg border border-white/10 bg-black/50 px-2 py-1 font-mono text-[10px] text-white/50 backdrop-blur-sm">
                      {galleryIndex + 1} / {screenshots.length}
                    </div>
                  )}
                  {/* Prev/Next arrows on main image */}
                  {screenshots.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + screenshots.length) % screenshots.length); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-sm text-white/80 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % screenshots.length); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-sm text-white/80 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail strip for additional screenshots */}
                {screenshots.length > 1 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {screenshots.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setGalleryIndex(i)}
                        className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                          i === galleryIndex
                            ? 'border-accent/80 shadow-[0_0_10px_rgba(245,158,11,0.25)] scale-105'
                            : 'border-border/40 opacity-50 hover:opacity-80 hover:border-border'
                        }`}
                      >
                        <img src={src} alt={`thumbnail ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
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
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground/90 font-sans">
                {project.description}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm text-muted-foreground/60">
              <span className="flex items-center gap-1.5">
                <span className="text-accent/70">by</span>
                <Link href={`/u/${project.user.username ?? project.user.id}`} className="hover:text-accent transition-colors font-semibold">
                  @{project.user.username ?? project.user.name ?? 'unknown'}
                </Link>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDate(project.createdAt)}
              </span>
              {project.lastActivityAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Last active {formatRelativeDate(project.lastActivityAt)}
                </span>
              )}
              {project.lineageDepth > 0 && (
                <span className="flex items-center gap-1.5 text-accent">
                  <Layers className="h-4 w-4" />
                  Lineage depth {project.lineageDepth}
                </span>
              )}
            </div>

            {/* Lineage Breadcrumb Preview */}
            {(project.parentProject || project.children.length > 0) && (
              <div className="mt-4 flex items-center gap-2 font-mono text-xs text-muted-foreground/50">
                <Layers className="h-3.5 w-3.5" />
                {project.parentProject && (
                  <>
                    <Link href={`/project/${project.parentProject.slug}`} className="hover:text-muted-foreground">Original</Link>
                    <span>→</span>
                  </>
                )}
                <span className="text-foreground/80 font-semibold">Current</span>
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
                onClick={() => isLoggedIn ? toggleLike() : router.push('/')}
                disabled={likePending}
                className={[
                  'flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-sm font-medium transition-all duration-200',
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
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{project.commentCount ?? 0}</span>
              </a>

              <span className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2 font-mono text-sm text-muted-foreground/60">
                <Flame className="h-4 w-4" />
                <span>{project.voteCount ?? 0}</span>
              </span>

              {/* View count */}
              <span className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2 font-mono text-sm text-muted-foreground/60">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>{project.viewCount ?? 0}</span>
              </span>

              {/* Follow button / It's you badge */}
              {isOwner ? (
                <div className="ml-auto flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2 font-mono text-sm font-medium text-accent">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  It's you
                </div>
              ) : (
                <button
                  onClick={() => isLoggedIn ? toggleFollow() : router.push('/')}
                  disabled={followPending}
                  className={[
                    'ml-auto flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-sm font-medium transition-all duration-200',
                    following
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-border/60 bg-card/60 text-muted-foreground hover:border-accent/30 hover:text-accent',
                    followPending ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {following ? (
                    <><BellOff className="h-4 w-4" /> {followerCount} Following</>
                  ) : (
                    <><Bell className="h-4 w-4" /> {followerCount} Follow</>
                  )}
                </button>
              )}
              {/* Ship button - for owners on ACTIVE or STALLED */}
              {isOwner && (project.state === 'ACTIVE' || project.state === 'STALLED') && (
                <button
                  onClick={handleShip}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  ✓ Mark as Shipped
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Unseal Time Capsule (Dead / Shipped only) ───────── */}
          {(project.state === 'DEAD' || project.state === 'SHIPPED') && (
            <motion.div {...sectionVariant(0.05)} className="mb-10 flex justify-center">
              <a
                href={`/project/${project.slug}/unseal`}
                className="group flex flex-col items-center gap-4 text-amber-500/80 hover:text-amber-500 transition-colors"
              >
                <div className="h-16 w-16 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                  <LockOpen className="h-7 w-7" />
                </div>
                <span className="font-mono text-xs uppercase tracking-[0.3em] font-semibold">Unseal Time Capsule</span>
              </a>
            </motion.div>
          )}


          {/* ── Health ──────────────────────────────────────────── */}
          <motion.section {...sectionVariant(0.07)}
            className="mb-8 rounded-2xl border border-foreground/[0.08] bg-card/60 p-6 backdrop-blur-sm">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
              Project Health
            </h2>
            <HealthIndicator health={project.health} showLabel showStateLabel className="max-w-sm" />
          </motion.section>

          {/* ── Community Vote ───────────────────────────────────── */}
          {project.state !== 'DEAD' && project.state !== 'SHIPPED' && (
            <motion.section {...sectionVariant(0.1)}
              className="mb-8 rounded-2xl border border-foreground/[0.08] bg-card/60 p-6 backdrop-blur-sm">
              <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
                Community Prediction
              </h2>
              <VoteBar
                projectId={project.id}
                initialStats={initialVoteStats}
                isLoggedIn={isLoggedIn}
              />
            </motion.section>
          )}



          {/* ── Stack ───────────────────────────────────────────── */}
          {project.stack.length > 0 && (
            <motion.section {...sectionVariant(0.16)} className="mb-8">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-medium flex items-center gap-2">
                <Layers className="h-4 w-4" /> Stack
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span key={tech}
                    className="rounded-lg border border-foreground/[0.1] bg-foreground/[0.04] px-3 py-1.5 font-mono text-xs tracking-wide text-muted-foreground font-medium">
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
                className="group inline-flex items-center gap-2.5 rounded-xl border border-foreground/[0.1] bg-foreground/[0.03] px-4 py-3 font-mono text-sm text-muted-foreground transition-all hover:border-foreground/20 hover:bg-foreground/[0.06] hover:text-foreground"
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
              <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
                Lineage
              </h2>
              {project.parentProject && (
                <div className="mb-3 flex items-center gap-2 font-mono text-sm text-muted-foreground">
                  <span className="text-accent/70">↑</span>
                  <span>Resurrected from</span>
                  <Link href={`/project/${project.parentProject.slug}`}
                        className="text-foreground underline-offset-2 hover:underline">
                    {project.parentProject.title}
                  </Link>
                </div>
              )}
              {project.children.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-muted-foreground">
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
                className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.16em] text-accent/80 transition-colors hover:text-accent font-medium"
              >
                View Lineage Graph →
              </Link>
            </motion.section>
          )}

          {/* ── Will & Testament + Time Capsules ──────────────────── */}
          {(isOwner || project.testament || (project.timeCapsules && project.timeCapsules.length > 0)) && (
            <motion.section {...sectionVariant(0.22)} className="mb-8 rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-6">
              <TimeCapsuleSection
                projectId={project.id}
                isOwner={isOwner}
                initialTestament={project.testament ?? null}
                initialCapsules={project.timeCapsules ?? []}
                isDead={project.state === 'DEAD' || project.state === 'SHIPPED'}
                readOnly={project.state === 'DEAD' || project.state === 'SHIPPED'}
                hasBeenResurrected={Boolean(project.children && project.children.length > 0)}
              />
            </motion.section>
          )}

          {/* ── Timeline ────────────────────────────────────────── */}
          <motion.section {...sectionVariant(0.23)} className="mb-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
                Timeline
              </h2>
              {isOwner && project.state !== 'DEAD' && project.state !== 'SHIPPED' && (
                <button
                  onClick={() => {
                    setUpdateTitle('');
                    setUpdateDescription('');
                    setUpdateError('');
                    setUpdateModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 font-mono text-[10px] font-semibold tracking-wider text-accent transition-colors hover:bg-accent/10"
                >
                  <Plus className="h-3 w-3" /> Log Update
                </button>
              )}
            </div>
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
          {isOwner && (
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
                {project.state !== 'SHIPPED' && project.state !== 'DEAD' && (
                  <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isPending}>
                    Archive as Dead
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={handlePermanentDelete} isLoading={isPending} className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20">
                  Delete Project
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

          {/* ── Code Afterlife AI Chatbot ────────────────────────── */}
          <motion.section {...sectionVariant(0.29)} className="mb-8">
            <h2 className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Ask AI
            </h2>
            <ProjectChatbot 
              projectId={project.id}
              isLoggedIn={isLoggedIn}
            />
          </motion.section>

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
              isProjectOwner={isOwner}
            />
          </motion.section>
        </main>
      </DecayVisuals>
    </div>
  );
}
