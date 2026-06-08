'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageSquare,
  Flame,
  ExternalLink,
  Hash,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Loader2,
  Activity,
} from 'lucide-react';
import type { ProjectWithUser } from '@/types/project';
import { StateBadge } from '@/components/StateBadge';
import { useDecayState } from '@/hooks/use-decay-state';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ExploreFeedClientProps {
  initialProjects: ProjectWithUser[];
  initialCursor: string | null;
  trendingTags: string[];
  currentUserId: string | null;
  likedProjectIds: string[];
  votedProjectIds: string[];
}

// ─────────────────────────────────────────────────────────────
// Image Lightbox (opens on image click, full-screen)
// ─────────────────────────────────────────────────────────────

function ImageLightbox({
  images,
  startIndex,
  projectTitle,
  projectSlug,
  onClose,
}: {
  images: string[];
  startIndex: number;
  projectTitle: string;
  projectSlug: string;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-black/96 backdrop-blur-xl"
      onClick={onClose}
    >
      {/* Top Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-sm font-bold text-white/90 truncate max-w-[200px]">{projectTitle}</h3>
          {images.length > 1 && (
            <span className="font-mono text-xs text-white/30">{current + 1} / {images.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/project/${projectSlug}`}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-mono text-xs font-semibold text-white/90 hover:bg-white/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Project
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={current}
            src={images[current]}
            alt={`${projectTitle} screenshot ${current + 1}`}
            initial={{ opacity: 0, x: 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 140px)' }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur-sm text-white/90 hover:bg-black/80 transition-all hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur-sm text-white/90 hover:bg-black/80 transition-all hover:scale-105"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dot Navigation */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-4" onClick={(e) => e.stopPropagation()}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'w-5 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/60'
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline Post Image Carousel (slides through screenshots)
// ─────────────────────────────────────────────────────────────

function PostImageCarousel({
  images,
  projectTitle,
  onImageClick,
}: {
  images: string[];
  projectTitle: string;
  onImageClick: (index: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const hasMultiple = images.length > 1;

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => (c - 1 + images.length) % images.length);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => (c + 1) % images.length);
  };

  return (
    <div className="relative mt-3 overflow-hidden rounded-xl border border-border/30 bg-black group/carousel">
      {/* 16:9 image container */}
      <div
        className="relative aspect-video cursor-zoom-in"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onImageClick(current); }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={current}
            src={images[current]}
            alt={`${projectTitle} screenshot ${current + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Zoom hint on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/carousel:bg-black/15 transition-colors duration-200">
          <ZoomIn className="h-7 w-7 text-white opacity-0 group-hover/carousel:opacity-70 transition-opacity drop-shadow-lg" />
        </div>

        {/* Prev/Next arrows (only when multiple) */}
        {hasMultiple && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/80"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10 opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/80"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Dot navigation strip */}
      {hasMultiple && (
        <div className="flex items-center justify-center gap-1.5 py-2 bg-black/40">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'w-4 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Health Pulse Dot
// ─────────────────────────────────────────────────────────────

function HealthDot({ health }: { health: number }) {
  const color =
    health >= 80 ? 'bg-sky-400' :
    health >= 60 ? 'bg-emerald-400' :
    health >= 40 ? 'bg-amber-400' :
    health >= 20 ? 'bg-red-400' :
    'bg-neutral-500';

  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {health >= 40 && (
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', color)} />
      )}
      <span className={cn('relative inline-flex rounded-full h-2 w-2', color)} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Single Feed Post (Twitter card style)
// ─────────────────────────────────────────────────────────────

function FeedPost({
  project,
  currentUserId,
  initialLiked,
  initialVoted,
}: {
  project: ProjectWithUser;
  currentUserId: string | null;
  initialLiked: boolean;
  initialVoted: boolean;
}) {
  const router = useRouter();
  const { decayState, healthPercent } = useDecayState(project.health);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Like state — seeded from server so icon is pre-colored on first render
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(project.likeCount);
  const [likeLoading, setLikeLoading] = useState(false);

  // Vote state — seeded from server (WILL_SHIP only for the fire icon)
  const [myVote, setMyVote] = useState<'WILL_SHIP' | 'WILL_DIE' | null>(initialVoted ? 'WILL_SHIP' : null);
  const [voteCount, setVoteCount] = useState(project.voteCount);
  const [voteLoading, setVoteLoading] = useState(false);

  const isOwner = !!currentUserId && currentUserId === project.userId;
  const isLoggedIn = !!currentUserId;

  const displayName = project.user.name ?? project.user.username ?? 'Developer';
  const handle = project.user.username ? `@${project.user.username}` : '';
  const timeAgo = formatRelativeDate(new Date(project.createdAt));
  const hasImages = project.screenshots && project.screenshots.length > 0;

  const cardFilter =
    decayState === 'dead' ? 'grayscale(55%) brightness(0.85)' :
    decayState === 'nearDeath' ? 'grayscale(25%) brightness(0.9)' :
    decayState === 'unstable' ? 'saturate(80%)' :
    'none';

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { router.push('/'); return; }
    if (likeLoading) return;
    // Optimistic
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);
    setLikeLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/like`, { method: 'POST' });
      if (!res.ok) {
        // Revert on failure
        setLiked(wasLiked);
        setLikeCount((c) => wasLiked ? c + 1 : c - 1);
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
    } finally {
      setLikeLoading(false);
    }
  };

  // Fire = WILL_SHIP vote. Toggle: same vote removes it, calling again removes it.
  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) { router.push('/'); return; }
    if (voteLoading) return;
    const wasVoted = myVote === 'WILL_SHIP';
    // Optimistic
    setMyVote(wasVoted ? null : 'WILL_SHIP');
    setVoteCount((c) => wasVoted ? c - 1 : c + 1);
    setVoteLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: 'WILL_SHIP' }),
      });
      if (!res.ok) {
        // Revert
        setMyVote(wasVoted ? 'WILL_SHIP' : null);
        setVoteCount((c) => wasVoted ? c + 1 : c - 1);
      }
    } catch {
      setMyVote(wasVoted ? 'WILL_SHIP' : null);
      setVoteCount((c) => wasVoted ? c + 1 : c - 1);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleShip = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (voteLoading || likeLoading) return;
    try {
      await fetch(`/api/projects/${project.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'SHIPPED' }),
      });
      router.refresh();
    } catch { /* ignore */ }
  };

  const voted = myVote === 'WILL_SHIP';

  return (
    <>
      <AnimatePresence>
        {lightboxIndex !== null && hasImages && (
          <ImageLightbox
            images={project.screenshots!}
            startIndex={lightboxIndex}
            projectTitle={project.title}
            projectSlug={project.slug}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        onClick={() => router.push(`/project/${project.slug}`)}
        className="relative border-b border-border/50 px-4 py-4 hover:bg-white/[0.018] transition-colors duration-200 cursor-pointer"
        style={{ filter: cardFilter, transition: 'filter 0.6s ease' }}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 pt-0.5">
            <Link href={`/project/${project.slug}`} onClick={(e) => e.stopPropagation()}>
              <div className="h-10 w-10 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center font-bold text-sm text-muted-foreground hover:opacity-80 transition-opacity">
                {project.user.image ? (
                  <img src={project.user.image} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Header: name / handle / time / state */}
            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mb-0.5">
              <span className="font-semibold text-sm text-foreground leading-none truncate max-w-[140px]">
                {displayName}
              </span>
              {handle && (
                <span className="font-mono text-xs text-muted-foreground/50 truncate">
                  {handle}
                </span>
              )}
              <span className="text-muted-foreground/30 text-xs">·</span>
              <span className="font-mono text-xs text-muted-foreground/40 shrink-0">{timeAgo}</span>
              <div className="ml-auto shrink-0">
                <StateBadge state={project.state} />
              </div>
            </div>

            {/* Clickable title */}
            <Link href={`/project/${project.slug}`}>
              <h2 className="font-mono text-[15px] font-bold text-foreground leading-snug mb-2 hover:text-accent transition-colors duration-150">
                {project.title}
              </h2>
            </Link>

            {/* Description */}
            {project.description && (
              <p className="text-sm text-muted-foreground/75 leading-relaxed mb-3 line-clamp-3">
                {project.description}
              </p>
            )}

            {/* Stack pills */}
            {project.stack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {project.stack.slice(0, 5).map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-secondary/80 text-muted-foreground/65 border border-border/40"
                  >
                    {tech}
                  </span>
                ))}
                {project.stack.length > 5 && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-sm bg-secondary/40 text-muted-foreground/35 border border-border/30">
                    +{project.stack.length - 5}
                  </span>
                )}
              </div>
            )}

            {/* Health */}
            <div className="flex items-center gap-2 mb-3">
              <HealthDot health={project.health} />
              <span className="font-mono text-[11px] text-muted-foreground/50">
                Health {healthPercent}%
              </span>
            </div>

            {/* Inline Image Carousel */}
            {hasImages && (
              <PostImageCarousel
                images={project.screenshots!}
                projectTitle={project.title}
                onImageClick={(i) => setLightboxIndex(i)}
              />
            )}

            {/* No screenshots placeholder */}
            {!hasImages && (
              <div className="mt-2 flex items-center justify-center h-16 rounded-xl border border-dashed border-border/30 bg-secondary/10">
                <span className="font-mono text-[10px] text-muted-foreground/25 uppercase tracking-widest">
                  no screenshots
                </span>
              </div>
            )}

            {/* Interaction Bar */}
            <div className="mt-3 flex items-center gap-1">
              {/* Like */}
              <button
                onClick={handleLike}
                className={cn(
                  'group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-rose-500/10',
                  liked ? 'text-rose-400' : 'text-muted-foreground/40 hover:text-rose-400'
                )}
              >
                <Heart className={cn('h-4 w-4 transition-transform group-active:scale-125', liked && 'fill-rose-400')} />
                <span className="font-mono text-xs">{likeCount}</span>
              </button>

              {/* Comment */}
              <Link
                href={`/project/${project.slug}#comments`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground/40 hover:text-sky-400 hover:bg-sky-400/10 transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="font-mono text-xs">{project.commentCount}</span>
              </Link>

              {/* Flame / Will Ship */}
              <button
                onClick={handleVote}
                className={cn(
                  'group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-orange-500/10',
                  voted ? 'text-orange-400' : 'text-muted-foreground/40 hover:text-orange-400'
                )}
              >
                <Flame className={cn('h-4 w-4 transition-transform group-active:scale-125', voted && 'fill-orange-400')} />
                <span className="font-mono text-xs">{voteCount}</span>
              </button>

              {/* View count */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground/25">
                <Activity className="h-4 w-4" />
                <span className="font-mono text-xs">{project.viewCount}</span>
              </div>

              {/* Ship button — only for owner on ACTIVE state (state machine: ACTIVE → SHIPPED) */}
              {isOwner && project.state === 'ACTIVE' && (
                <button
                  onClick={handleShip}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 transition-all duration-200 text-emerald-400 hover:bg-emerald-500/20"
                  title="Mark as Shipped"
                >
                  <span className="font-mono text-[10px] font-bold tracking-wider">✓ Ship</span>
                </button>
              )}

              {/* Open project */}
              <Link
                href={`/project/${project.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground/30 hover:text-accent hover:bg-accent/10 transition-all duration-200"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.article>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Feed Client
// ─────────────────────────────────────────────────────────────

export function ExploreFeedClient({ initialProjects, initialCursor, trendingTags, currentUserId, likedProjectIds, votedProjectIds }: ExploreFeedClientProps) {
  const [projects, setProjects] = useState<ProjectWithUser[]>(initialProjects);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({ rootMargin: '800px' });

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/search?sort=DISCOVERY&cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.data?.projects)) {
        setProjects((prev) => [...prev, ...json.data.projects]);
        setCursor(json.data.nextCursor ?? null);
      }
    } catch (e) {
      console.error('Failed to load more:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  useEffect(() => {
    if (loadMoreInView && !loadingMore) loadMore();
  }, [loadMoreInView, loadMore, loadingMore]);

  return (
    <div className="flex w-full h-full" style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── Main Feed ── */}
      <main className="flex-1 border-x border-border/50">

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 border-b border-border/50 bg-background/85 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <h1 className="font-mono text-[13px] font-bold tracking-[0.2em] uppercase text-foreground/70">
            Explore
          </h1>
          <span className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest">
            {projects.length} posts
          </span>
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground/30">
            <Activity className="h-10 w-10 mb-4 opacity-30" />
            <p className="font-mono text-sm">The graveyard is quiet.</p>
          </div>
        )}

        {/* Posts */}
        <div>
          {projects.map((project) => (
            <FeedPost
              key={project.id}
              project={project}
              currentUserId={currentUserId}
              initialLiked={likedProjectIds.includes(project.id)}
              initialVoted={votedProjectIds.includes(project.id)}
            />
          ))}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="h-16 flex items-center justify-center">
          {loadingMore ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
          ) : !cursor && projects.length > 0 ? (
            <p className="font-mono text-[11px] text-muted-foreground/20 uppercase tracking-widest">
              — end of feed —
            </p>
          ) : null}
        </div>
      </main>

      {/* ── Right Sidebar ── */}
      <aside className="hidden lg:flex w-[320px] flex-col border-l border-border/40 px-5 py-4 shrink-0">
        <div className="sticky top-4 flex flex-col gap-4">

          {/* Trending Topics */}
          <div className="rounded-2xl border border-border/40 bg-card/20 p-4">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50 mb-3">
              Trending Topics
            </h2>
            <div className="flex flex-col gap-0.5">
              {trendingTags.map((tag, i) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="group flex items-center gap-3 rounded-lg p-2.5 hover:bg-white/5 transition-colors duration-150"
                >
                  <span className="font-mono text-[10px] text-muted-foreground/25 w-3 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                    <span className="font-mono text-[12px] font-semibold text-foreground/70 group-hover:text-accent transition-colors">
                      {tag}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>



          <p className="font-mono text-[9px] text-muted-foreground/20 px-2 leading-relaxed">
            Software Never Dies. — Code Afterlife
          </p>
        </div>
      </aside>
    </div>
  );
}
