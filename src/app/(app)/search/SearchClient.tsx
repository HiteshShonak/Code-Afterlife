'use client';

import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Grid3x3, List, X, Flame, Zap, AlertTriangle,
  CheckCircle, Skull, Sprout, type LucideIcon, Loader2,
} from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';
import { useSearchFilters, type SearchSort } from '@/hooks/use-search-filters';
import type { ProjectWithUser } from '@/types/project';
import type { ProjectState } from '@prisma/client';

interface SearchClientProps {
  initialProjects: ProjectWithUser[];
  initialCursor:   string | null;
}

const STATE_FILTERS: { label: string; value: ProjectState | undefined; icon: LucideIcon; color: string; glow: string }[] = [
  { label: 'All',     value: undefined, icon: Flame,         color: 'text-muted-foreground', glow: '' },
  { label: 'Active',  value: 'ACTIVE',  icon: Zap,           color: 'text-emerald-400',       glow: 'shadow-emerald-500/20' },
  { label: 'Born',    value: 'BORN',    icon: Sprout,        color: 'text-blue-400',           glow: 'shadow-blue-500/20' },
  { label: 'Stalled', value: 'STALLED', icon: AlertTriangle, color: 'text-amber-400',          glow: 'shadow-amber-500/20' },
  { label: 'Shipped', value: 'SHIPPED', icon: CheckCircle,   color: 'text-teal-400',           glow: 'shadow-teal-500/20' },
  { label: 'Dead',    value: 'DEAD',    icon: Skull,         color: 'text-red-400/80',         glow: 'shadow-red-900/20' },
];

const SORT_OPTIONS: { label: string; value: SearchSort }[] = [
  { label: 'Trending',   value: 'TRENDING'   },
  { label: 'Newest',     value: 'NEWEST'     },
  { label: 'Health',     value: 'HEALTH'     },
  { label: 'Most Liked', value: 'MOST_LIKED' },
];

const STATE_META: Record<ProjectState, { label: string; tagline: string; color: string }> = {
  BORN:    { label: 'Born',    tagline: 'Just started its journey',              color: 'oklch(0.60 0.18 240)' },
  ACTIVE:  { label: 'Active',  tagline: 'Alive and growing',                     color: 'oklch(0.60 0.18 150)' },
  STALLED: { label: 'Stalled', tagline: 'No activity for 30+ days',              color: 'oklch(0.72 0.14 60)'  },
  SHIPPED: { label: 'Shipped', tagline: 'Made it across the finish line',        color: 'oklch(0.66 0.18 162)' },
  DEAD:    { label: 'Dead',    tagline: 'Abandoned — waiting to be resurrected', color: 'oklch(0.52 0.12 25)'  },
};

const EASE = [0.16, 1, 0.3, 1] as const;

export const SearchClient = memo(function SearchClient({ initialProjects, initialCursor }: SearchClientProps) {
  const { state, search, sort, setState, setSearch, setSort, reset } = useSearchFilters();
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');

  // Local state for the input to prevent router transitions from stealing focus while typing
  const [localSearch, setLocalSearch] = useState(search);

  // Sync external search changes (e.g. from Clear button) into local state
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce the push to the URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, search, setSearch]);

  const [projects, setProjects]     = useState<ProjectWithUser[]>(initialProjects);
  const [cursor, setCursor]         = useState<string | null>(initialCursor);
  const [loading, setLoading]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const isInitialState = !state && search === '' && sort === 'TRENDING';

  // ── Fetch on filter change (debounced implicitly by localSearch -> search) ──
  useEffect(() => {
    if (isInitialState && projects.length > 0 && projects[0].id === initialProjects[0]?.id) return;

    // We no longer need the 400ms delay here because 'search' itself is debounced!
    setLoading(true);

    let isMounted = true;
    const fetchResults = async () => {
      try {
        const params = new URLSearchParams({ sort });
        if (state)  params.set('state', state);
        if (search) params.set('q', search);

        const res = await fetch(`/api/search?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && isMounted) {
          setProjects(json.data.projects);
          setCursor(json.data.nextCursor);
        }
      } catch { /* stale data is fine */ }
      finally   { if (isMounted) setLoading(false); }
    };

    fetchResults();

    return () => { isMounted = false; };
  }, [search, state, sort]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ sort, cursor });
      if (state)  params.set('state', state);
      if (search) params.set('q', search);

      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setProjects(prev => {
          const next = json.data.projects.filter((p: ProjectWithUser) => !prev.some(o => o.id === p.id));
          return [...prev, ...next];
        });
        setCursor(json.data.nextCursor);
      }
    } catch { /* no-op */ }
    finally { setLoadingMore(false); }
  }, [cursor, loadingMore, search, sort, state]);

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && cursor) loadMore();
    });
    if (node) observerRef.current.observe(node);
  }, [cursor, loadMore, loadingMore]);

  const hasActiveFilter  = !!state || !!search.trim();
  const activeFilter     = STATE_FILTERS.find(f => f.value === state) ?? STATE_FILTERS[0];
  const ActiveBannerIcon = activeFilter.icon;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-32 pt-10 md:px-10 min-h-screen">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="mb-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60 mb-2">
          Code Afterlife — Search
        </p>
        <h1 className="font-mono text-3xl font-extrabold tracking-tight text-foreground transition-colors duration-300">
          {state ? (
            <>
              <span style={{ color: STATE_META[state].color }}>{STATE_META[state].label}</span>{' '}projects
            </>
          ) : 'All Projects'}
        </h1>
        <p className="mt-2 font-mono text-[12px] text-muted-foreground/70 transition-colors duration-300">
          {state ? STATE_META[state].tagline : 'Software in every stage of its lifecycle — born, alive, stalled, shipped, and dead.'}
        </p>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="mb-8 space-y-4">
        {/* State chips */}
        <div className="flex flex-wrap items-center gap-2">
          {STATE_FILTERS.map(f => {
            const Icon     = f.icon;
            const isActive = state === f.value;
            return (
              <button
                key={f.label}
                onClick={() => {
                  if (state !== f.value) {
                    setProjects([]);
                    setLoading(true);
                    setState(f.value);
                  }
                }}
                className={[
                  'group flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] font-medium tracking-wide transition-all duration-200 border',
                  isActive
                    ? 'bg-foreground/10 border-foreground/30 text-foreground shadow-md ' + f.glow
                    : 'border-border/50 text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-white/[0.04]',
                ].join(' ')}
              >
                <Icon className={['h-3.5 w-3.5 transition-colors', isActive ? f.color : 'text-muted-foreground/50 group-hover:' + f.color].join(' ')} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Search + Sort + View toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              type="text"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search by title..."
              className="h-10 w-full rounded-xl border border-border/60 bg-card/60 pl-9 pr-20 font-mono text-[12px] text-foreground backdrop-blur-sm outline-none placeholder:text-muted-foreground/40 focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            {hasActiveFilter && (
              <button
                onClick={() => {
                  setProjects([]);
                  setLoading(true);
                  reset();
                }}
                className="absolute right-2 flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10px] text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={e => {
              const newSort = e.target.value as SearchSort;
              if (sort !== newSort) {
                setProjects([]);
                setLoading(true);
                setSort(newSort);
              }
            }}
            className="h-10 rounded-xl border border-border/60 bg-card/60 px-3 font-mono text-[11px] text-foreground outline-none focus:border-accent/40 backdrop-blur-sm cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <div className="flex rounded-xl border border-border/60 bg-card/60 overflow-hidden backdrop-blur-sm">
            {(['grid', 'feed'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={['flex items-center justify-center p-2.5 transition-colors', viewMode === mode ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground'].join(' ')}
                aria-label={`${mode} view`}
              >
                {mode === 'grid' ? <Grid3x3 className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── State banner — CSS transition only (no AnimatePresence / unmount) ──
          AnimatePresence would remove the element from the DOM instantly on exit,
          collapsing its height and shifting the grid below it. Instead we use
          max-height + opacity CSS transition so the space animates smoothly.
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-out"
        style={{
          maxHeight:    state ? '80px'  : '0px',
          opacity:      state ? 1       : 0,
          marginBottom: state ? '24px'  : '0px',
        }}
      >
        {/* Always in the DOM but hidden — avoids layout jump */}
        <div
          className="flex items-center gap-3 rounded-xl border px-5 py-3.5"
          style={{
            borderColor:     (state ? STATE_META[state].color : '#fff') + '33',
            backgroundColor: (state ? STATE_META[state].color : '#fff') + '0d',
          }}
        >
          <ActiveBannerIcon className={['h-4 w-4 flex-shrink-0', activeFilter.color].join(' ')} />
          <div>
            <p className="font-mono text-[11px] font-semibold text-foreground">
              {state ? `Showing ${STATE_META[state].label} projects` : ''}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/60">
              {state ? STATE_META[state].tagline : ''}
            </p>
          </div>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────────
          min-h-[400px] provides a baseline.
          Instead of unmounting the grid while loading, we keep it in the DOM
          and just lower its opacity, preventing massive layout shifts.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="min-h-[600px] relative">
        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex justify-center py-32 pointer-events-none bg-background/20 backdrop-blur-[1px] rounded-2xl"
            >
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="transition-opacity duration-300">
          {projects.length === 0 && !loading ? (
            /* ── Empty ── */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-40 text-center"
            >
              <p className="font-mono text-4xl mb-4 opacity-20">
                {state === 'DEAD' ? '💀' : state === 'SHIPPED' ? '✅' : '⚰️'}
              </p>
              <p className="font-mono text-[14px] text-foreground">
                {hasActiveFilter ? 'No projects match your filters.' : 'No projects found.'}
              </p>
              {hasActiveFilter && (
                <button onClick={reset} className="mt-4 font-mono text-[11px] text-accent/70 underline-offset-2 hover:underline">
                  Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            /* ── Grid / Feed ── */
            <div
              className={
                viewMode === 'grid'
                  ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
                  : 'flex flex-col gap-5 max-w-3xl mx-auto'
              }
            >
              {projects.map((p) => (
                <div key={p.id}>
                  <ProjectCard
                    id={p.id}
                    slug={p.slug}
                    title={p.title}
                    description={p.description}
                    state={p.state}
                    health={p.health}
                    stack={p.stack}
                    screenshots={p.screenshots}
                    lastActivityAt={p.lastActivityAt}
                    createdAt={p.createdAt}
                    ownerUsername={p.user?.username ?? null}
                    likeCount={p.likeCount}
                    commentCount={p.commentCount}
                    voteCount={p.voteCount}
                    trendingScore={p.trendingScore}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Infinite scroll trigger ─────────────────────────────────────────── */}
      {cursor && !loading && (
        <div ref={loadMoreRef} className="mt-12 flex items-center justify-center py-8">
          {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />}
        </div>
      )}

    </div>
  );
});
