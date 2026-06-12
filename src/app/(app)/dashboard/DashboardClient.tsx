'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectCreateModal } from '@/components/ProjectCreateModal';
import { Button } from '@/components/ui/Button';
import { useDashboardFilters, DashboardFilter, DashboardSort } from '@/hooks/use-dashboard-filters';
import type { Project } from '@prisma/client';

interface DashboardClientProps {
  projects: Project[];
  user: {
    id:       string;
    name:     string | null;
    username: string | null;
    image:    string | null;
  };
}

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};


export function DashboardClient({ projects: initialProjects, user }: DashboardClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { filter, setFilter, sort, setSort, projects } = useDashboardFilters(initialProjects);

  const stats = {
    total:   initialProjects.length,
    active:  initialProjects.filter(p => p.state === 'ACTIVE').length,
    stalled: initialProjects.filter(p => p.state === 'STALLED').length,
    dead:    initialProjects.filter(p => p.state === 'DEAD').length,
    shipped: initialProjects.filter(p => p.state === 'SHIPPED').length,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user.username ?? user.name ?? 'Developer';

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-12 md:px-10">
      {/* Welcome strip */}
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            {getGreeting()}, @{displayName}
          </p>
          <h1 className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-foreground">
            You have{' '}
            <span className="text-accent">{stats.active}</span>{' '}
            project{stats.active !== 1 ? 's' : ''} alive.
          </h1>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground/50">
            {stats.total} total · {stats.stalled} stalled · {stats.dead} dead · {stats.shipped} shipped
          </p>
        </div>

        {/* Stats + Sort row */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-1.5 rounded-xl border border-border/60 bg-card/60 p-1.5 backdrop-blur-sm">
            <StatPill label="All" value={stats.total} onClick={() => setFilter('ALL')} active={filter === 'ALL'} />
            <StatPill label="Active" value={stats.active} onClick={() => setFilter('ACTIVE')} active={filter === 'ACTIVE'} color="text-emerald-400" />
            <StatPill label="Stalled" value={stats.stalled} onClick={() => setFilter('STALLED')} active={filter === 'STALLED'} color="text-amber-400" />
            <StatPill label="Dead" value={stats.dead} onClick={() => setFilter('DEAD')} active={filter === 'DEAD'} color="text-red-400" />
            <StatPill label="Shipped" value={stats.shipped} onClick={() => setFilter('SHIPPED')} active={filter === 'SHIPPED'} color="text-teal-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as DashboardSort)}
              className="rounded-lg border border-border/60 bg-card/60 px-2.5 py-1.5 font-mono text-[11px] text-foreground outline-none focus:border-accent/40 cursor-pointer"
            >
              <option value="TRENDING">🔥 Trending</option>
              <option value="HEALTH_DESC">Health ↓</option>
              <option value="HEALTH_ASC">Health ↑</option>
              <option value="NEWEST">Newest</option>
              <option value="OLDEST">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active filter context label */}
      {filter !== 'ALL' && (
        <div className="mb-6 flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground/60">Showing</span>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 font-mono text-[11px] text-accent">
            {filter}
          </span>
          <button
            onClick={() => setFilter('ALL')}
            className="font-mono text-[10px] text-muted-foreground/50 underline-offset-2 hover:underline"
          >
            clear
          </button>
        </div>
      )}
      {projects.length === 0 ? (
        <EmptyState onNew={() => setCreateOpen(true)} isFiltered={initialProjects.length > 0} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {projects.map((p) => (
            <motion.div key={p.id} variants={cardVariants}>
              <ProjectCard
                id={p.id}
                slug={p.slug}
                title={p.title}
                description={p.description}
                state={p.state}
                health={p.health}
                stack={p.stack}
                lastActivityAt={p.lastActivityAt}
                createdAt={p.createdAt}
                screenshots={p.screenshots}
                likeCount={p.likeCount}
                commentCount={p.commentCount}
                voteCount={p.voteCount}
                viewCount={p.viewCount}
                trendingScore={p.trendingScore}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* FAB */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-background shadow-lg shadow-accent/20 transition-transform hover:scale-110 active:scale-95"
        aria-label="Create new project"
      >
        +
      </button>

      <ProjectCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function StatPill({ label, value, onClick, active, color = 'text-foreground/70' }: {
  label: string;
  value: number;
  onClick: () => void;
  active: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={['flex flex-col items-center justify-center rounded-lg px-3.5 py-2 transition-colors', active ? 'bg-background shadow-sm' : 'hover:bg-background/50'].join(' ')}
    >
      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">{label}</span>
      <span className={['font-mono text-base font-bold', active ? color || 'text-foreground' : 'text-foreground/60'].join(' ')}>{value}</span>
    </button>
  );
}

function EmptyState({ onNew, isFiltered }: { onNew: () => void; isFiltered: boolean }) {
  if (isFiltered) {
    return (
      <div className="py-24 text-center font-mono text-[13px] text-muted-foreground">
        No projects match this filter.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 font-mono text-5xl opacity-20 transition-opacity hover:opacity-100">⚰</div>
      <p className="font-mono text-[14px] text-foreground">Your first project is waiting to be born.</p>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
        Every codebase has a lifecycle. Start tracking yours.
      </p>
      <Button variant="outline" size="md" className="mt-8" onClick={onNew}>
        + Register First Project
      </Button>
    </div>
  );
}
