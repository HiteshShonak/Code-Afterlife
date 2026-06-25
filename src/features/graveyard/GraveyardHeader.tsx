'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, ArrowUpDown, X, Check, ChevronDown, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// config

export type GraveyardSort = 'trending' | 'newest' | 'oldest' | 'most_connections';

export const SORT_OPTIONS: { value: GraveyardSort; label: string }[] = [
  { value: 'trending',         label: 'Trending'         },
  { value: 'newest',           label: 'Latest'           },
  { value: 'oldest',           label: 'Oldest'           },
  { value: 'most_connections', label: 'Most Connected'   },
];

const TECH_FILTERS = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust',
  'Vue', 'Svelte', 'Node.js', 'Express', 'FastAPI', 'Django', 'Rails',
  'PostgreSQL', 'MongoDB', 'Redis', 'Prisma', 'Docker', 'Flutter', 'Swift',
];

// props

export interface GraveyardFilters {
  search: string;
  techs: string[];
  sort: GraveyardSort;
}

interface GraveyardHeaderProps {
  filters: GraveyardFilters;
  onChange: (filters: GraveyardFilters) => void;
}

// left dropdown

function TechPanel({
  selected,
  onToggle,
  onClear,
}: {
  selected: string[];
  onToggle: (t: string) => void;
  onClear: () => void;
}) {
  return (
    <motion.div
      key="tech-panel"
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-[calc(100%+10px)] z-50 w-[90vw] sm:w-72 max-w-[288px] overflow-hidden rounded-2xl border border-white/12 bg-[#080c18]/80 shadow-2xl shadow-black/60 backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50">
          Filter by Technology
        </p>
        {selected.length > 0 && (
          <button
            onClick={onClear}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-purple-400/70 transition-colors hover:text-purple-300"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {TECH_FILTERS.map((tech) => {
          const active = selected.includes(tech);
          return (
            <button
              key={tech}
              onClick={() => onToggle(tech)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-all duration-200',
                active
                  ? 'border-purple-500/40 bg-purple-500/15 text-purple-300'
                  : 'border-white/8 bg-white/3 text-muted-foreground/50 hover:border-white/15 hover:text-foreground/70',
              )}
            >
              {active && <Check className="h-2.5 w-2.5 shrink-0" />}
              {tech}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// right dropdown

function SortPanel({
  current,
  onSelect,
}: {
  current: GraveyardSort;
  onSelect: (s: GraveyardSort) => void;
}) {
  return (
    <motion.div
      key="sort-panel"
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-[calc(100%+10px)] z-50 w-48 overflow-hidden rounded-2xl border border-white/12 bg-[#080c18]/80 shadow-2xl shadow-black/60 backdrop-blur-2xl"
    >
      <div className="border-b border-white/[0.07] px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50">
          Sort by
        </p>
      </div>
      <div className="p-2">
        {SORT_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors',
              value === current
                ? 'bg-purple-500/15 text-purple-300'
                : 'text-muted-foreground/60 hover:bg-white/5 hover:text-foreground/80',
            )}
          >
            {label}
            {value === current && <Check className="h-3 w-3 text-purple-400" />}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// graveyard header

export function GraveyardHeader({ filters, onChange }: GraveyardHeaderProps) {
  const [techOpen, setTechOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  // search draft
  const [draft, setDraft] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTechOpen(false);
        setSortOpen(false);
        if (!filters.search) {
          setSearchExpanded(false);
          setDraft('');
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filters.search]);

  // focus input
  useEffect(() => {
    if (searchExpanded) {
      setDraft(filters.search);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchExpanded]);

  // commit search
  const commitSearch = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed !== filters.search) {
      onChange({ ...filters, search: trimmed });
    }
  }, [draft, filters, onChange]);

  // clear search
  const clearSearch = useCallback(() => {
    setDraft('');
    if (filters.search) onChange({ ...filters, search: '' });
  }, [filters, onChange]);

  // collapse search
  const collapseSearch = useCallback(() => {
    setSearchExpanded(false);
    setDraft('');
  }, []);

  const toggleTech = useCallback((tech: string) => {
    const next = filters.techs.includes(tech)
      ? filters.techs.filter((t) => t !== tech)
      : [...filters.techs, tech];
    onChange({ ...filters, techs: next });
  }, [filters, onChange]);

  const clearTechs = useCallback(() => {
    onChange({ ...filters, techs: [] });
  }, [filters, onChange]);

  const setSort = useCallback((sort: GraveyardSort) => {
    onChange({ ...filters, sort });
    setSortOpen(false);
  }, [filters, onChange]);

  const activeFiltersCount = filters.techs.length + (filters.search ? 1 : 0);

  // btn styles
  const btnBase =
    'relative flex items-center gap-1 sm:gap-2 rounded-xl border border-white/10 bg-[#07090f]/60 px-3 py-2 sm:px-4 sm:py-2.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-foreground/80 hover:bg-white/6';
  const btnActive =
    'border-purple-500/40 bg-purple-500/10 text-purple-300/80 hover:border-purple-400/60 hover:text-purple-200';

  const currentSort = SORT_OPTIONS.find((s) => s.value === filters.sort)!;

  // show enter hint
  const showEnterHint = draft.trim().length > 0 && draft.trim() !== filters.search;

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-40 flex items-start justify-center pt-6 px-4">
      <div ref={containerRef} className="pointer-events-auto relative flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-full">

        {/* ── Left: Filter by Tech ── */}
        <div className="relative">
          <button
            onClick={() => { setTechOpen((p) => !p); setSortOpen(false); setSearchExpanded(false); }}
            className={cn(btnBase, (techOpen || filters.techs.length > 0) && btnActive)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Technologies</span>
            {filters.techs.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500/40 font-mono text-[9px] text-purple-200">
                {filters.techs.length}
              </span>
            )}
            <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', techOpen && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {techOpen && <TechPanel selected={filters.techs} onToggle={toggleTech} onClear={clearTechs} />}
          </AnimatePresence>
        </div>

        {/* center search */}
        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            {searchExpanded ? (
              <motion.div
                key="search-expanded"
                initial={{ width: 44, opacity: 0 }}
                animate={{ width: typeof window !== "undefined" && window.innerWidth < 640 ? 220 : 280, opacity: 1 }}
                exit={{ width: 44, opacity: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="flex items-center gap-2 overflow-hidden rounded-xl border border-purple-500/30 bg-[#07090f]/70 px-3 py-2.5 backdrop-blur-sm"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-purple-400/60" />

                <input
                  ref={searchRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Search tombstones, press Enter…"
                  className="flex-1 bg-transparent font-mono text-[11px] text-foreground/80 placeholder:text-muted-foreground/25 outline-none min-w-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitSearch();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      if (draft) {
                        // clear draft
                        clearSearch();
                      } else {
                        // collapse bar
                        collapseSearch();
                      }
                    }
                  }}
                />

                {/* enter hint */}
                <AnimatePresence>
                  {showEnterHint && (
                    <motion.span
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 4 }}
                      transition={{ duration: 0.15 }}
                      className="flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-purple-400/50 select-none"
                    >
                      <CornerDownLeft className="h-2.5 w-2.5" />
                      Enter
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* x btn */}
                <button
                  onClick={() => {
                    if (draft || filters.search) {
                      clearSearch();
                    } else {
                      collapseSearch();
                    }
                  }}
                  className="shrink-0 rounded-lg p-0.5 text-muted-foreground/40 transition-colors hover:text-foreground/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="search-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => { setSearchExpanded(true); setTechOpen(false); setSortOpen(false); }}
                className={cn(btnBase, filters.search && btnActive)}
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
                {/* active search dot */}
                {filters.search && <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: Sort ── */}
        <div className="relative">
          <button
            onClick={() => { setSortOpen((p) => !p); setTechOpen(false); setSearchExpanded(false); }}
            className={cn(btnBase, sortOpen && btnActive)}
          >
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{currentSort.label}</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', sortOpen && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {sortOpen && <SortPanel current={filters.sort} onSelect={setSort} />}
          </AnimatePresence>
        </div>

        {/* active filter badge */}
        <AnimatePresence>
          {activeFiltersCount > 0 && !searchExpanded && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              onClick={() => { onChange({ search: '', techs: [], sort: filters.sort }); setDraft(''); }}
              className="flex items-center gap-1.5 rounded-xl border border-red-800/30 bg-red-950/40 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-red-400/70 transition-colors hover:text-red-300"
            >
              <X className="h-3 w-3" />
              Clear {activeFiltersCount > 1 ? `${activeFiltersCount} filters` : 'filter'}
            </motion.button>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
