'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, ShieldCheck, Skull, Code2, Flame, Star, Zap, Award, TrendingUp, Heart, Package } from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';
import { formatDate } from '@/lib/utils';
import type { User } from '@prisma/client';
import type { ProjectWithUser } from '@/types/project';

interface UserProfileClientProps {
  profileUser:         User;
  createdProjects:     ProjectWithUser[];
  resurrectedProjects: ProjectWithUser[];
  healthScore:         number;
  necromancerTier:     string | null;
  currentUserId:       string | null;
}

const CINEMATIC_EASE = [0.16, 1, 0.3, 1] as const;

/** Tier configuration for visual theming */
const TIER_CONFIG: Record<string, {
  label: string;
  color: string;
  glow: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = {
  'Lich King': {
    label: 'Lich King',
    color: 'text-violet-400',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    icon: Skull,
    description: 'Master of resurrection — 10+ projects revived',
  },
  'Master Necromancer': {
    label: 'Master Necromancer',
    color: 'text-amber-400',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    icon: Flame,
    description: 'Veteran resurrector — 5+ projects revived',
  },
  'Adept': {
    label: 'Adept',
    color: 'text-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]',
    icon: Zap,
    description: 'Rising necromancer — 2+ projects revived',
  },
  'Initiate': {
    label: 'Initiate',
    color: 'text-blue-400',
    glow: 'shadow-[0_0_15px_rgba(96,165,250,0.2)]',
    icon: Star,
    description: 'First resurrection achieved',
  },
};

/** Animated SVG ring for health score visualization */
function HealthRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? '#34d399' :
    score >= 50 ? '#60a5fa' :
    score >= 25 ? '#fbbf24' :
    '#f87171';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={5}
          className="text-foreground/[0.06]"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.4, ease: CINEMATIC_EASE, delay: 0.4 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      {/* Score label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-mono text-xl font-extrabold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">
          Score
        </span>
      </div>
    </div>
  );
}

/** Stat pill with animated count-up effect */
function StatPill({
  icon: Icon,
  label,
  value,
  colorClass,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  colorClass: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay ?? 0, ease: CINEMATIC_EASE }}
      className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/40 px-5 py-3.5 backdrop-blur-sm"
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${colorClass}`} />
      <div>
        <div className={`font-mono text-xl font-extrabold ${colorClass}`}>{value}</div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">{label}</div>
      </div>
    </motion.div>
  );
}

export function UserProfileClient({
  profileUser,
  createdProjects,
  resurrectedProjects,
  healthScore,
  necromancerTier,
}: UserProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'created' | 'resurrected' | 'shipped'>('created');

  const shippedProjects    = createdProjects.filter(p => p.state === 'SHIPPED');
  const deadProjects       = createdProjects.filter(p => p.state === 'DEAD');
  const tierConfig         = necromancerTier ? TIER_CONFIG[necromancerTier] : null;
  const TierIcon           = tierConfig?.icon ?? Award;

  const displayProjects =
    activeTab === 'created'     ? createdProjects :
    activeTab === 'resurrected' ? resurrectedProjects :
    shippedProjects;

  const tabs = [
    {
      id:    'created' as const,
      label: 'Created',
      icon:  Code2,
      count: createdProjects.length,
      activeColor: 'text-foreground',
      barColor:    'bg-foreground',
    },
    {
      id:    'resurrected' as const,
      label: 'Resurrected',
      icon:  Ghost,
      count: resurrectedProjects.length,
      activeColor: 'text-emerald-400',
      barColor:    'bg-emerald-400',
    },
    {
      id:    'shipped' as const,
      label: 'Shipped',
      icon:  Package,
      count: shippedProjects.length,
      activeColor: 'text-amber-400',
      barColor:    'bg-amber-400',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background atmosphere */}
      {tierConfig && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-3xl"
            style={{
              background: necromancerTier === 'Lich King'
                ? 'radial-gradient(circle, #8b5cf6, transparent)'
                : necromancerTier === 'Master Necromancer'
                ? 'radial-gradient(circle, #f59e0b, transparent)'
                : necromancerTier === 'Adept'
                ? 'radial-gradient(circle, #10b981, transparent)'
                : 'radial-gradient(circle, #60a5fa, transparent)',
            }}
          />
        </div>
      )}

      <main className="relative mx-auto max-w-5xl px-6 py-16 md:px-10 lg:py-24">

        {/* ── HERO HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: CINEMATIC_EASE }}
          className="mb-16"
        >
          <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left md:items-start">
            
            {/* Avatar + health ring */}
            <div className="relative flex-shrink-0">
              {/* Outer tier glow ring */}
              {tierConfig && (
                <div
                  className={`absolute inset-[-6px] rounded-full opacity-20 blur-md ${tierConfig.glow}`}
                  style={{
                    background: necromancerTier === 'Lich King'
                      ? 'radial-gradient(circle, #8b5cf6, transparent)'
                      : necromancerTier === 'Master Necromancer'
                      ? 'radial-gradient(circle, #f59e0b, transparent)'
                      : necromancerTier === 'Adept'
                      ? 'radial-gradient(circle, #10b981, transparent)'
                      : 'radial-gradient(circle, #60a5fa, transparent)',
                  }}
                />
              )}
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-border/40 shadow-xl">
                {profileUser.image ? (
                  <img
                    src={profileUser.image}
                    alt={profileUser.username ?? 'Avatar'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-4xl text-muted-foreground">
                    <Ghost className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            </div>

            {/* Name + tier + joined */}
            <div className="flex-1 min-w-0">
              <h1 className="font-mono text-3xl font-extrabold text-foreground md:text-5xl truncate">
                @{profileUser.username ?? profileUser.name ?? 'developer'}
              </h1>
              <p className="mt-2 font-mono text-[12px] text-muted-foreground/50">
                Member since {formatDate(profileUser.createdAt)}
              </p>

              {/* Necromancer tier badge */}
              {necromancerTier && tierConfig && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: CINEMATIC_EASE }}
                  className={`mt-4 inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 ${
                    necromancerTier === 'Lich King'
                      ? 'border-violet-500/30 bg-violet-500/5'
                      : necromancerTier === 'Master Necromancer'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : necromancerTier === 'Adept'
                      ? 'border-emerald-500/25 bg-emerald-500/5'
                      : 'border-blue-500/25 bg-blue-500/5'
                  }`}
                >
                  <TierIcon className={`h-4 w-4 ${tierConfig.color}`} />
                  <span className={`font-mono text-[12px] font-bold ${tierConfig.color}`}>
                    {tierConfig.label}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/50 hidden sm:block">
                    — {tierConfig.description}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Stat Row */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            
            {/* Health Ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
              className="col-span-2 sm:col-span-1 flex flex-col items-center gap-2 rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm"
            >
              <HealthRing score={healthScore} size={88} />
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50 text-center">
                Dev Health
              </div>
            </motion.div>

            <StatPill
              icon={Code2}
              label="Created"
              value={createdProjects.length}
              colorClass="text-foreground/80"
              delay={0.3}
            />
            <StatPill
              icon={Ghost}
              label="Resurrected"
              value={resurrectedProjects.length}
              colorClass="text-emerald-400"
              delay={0.35}
            />
            <StatPill
              icon={Package}
              label="Shipped"
              value={shippedProjects.length}
              colorClass="text-amber-400"
              delay={0.4}
            />
            <StatPill
              icon={Skull}
              label="Dead"
              value={deadProjects.length}
              colorClass="text-muted-foreground/50"
              delay={0.45}
            />
          </div>
        </motion.div>

        {/* ── TABS ── */}
        <div className="mb-8 flex border-b border-border/40 font-mono text-[12px] uppercase tracking-widest text-muted-foreground/60 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                  isActive ? tab.activeColor : 'hover:text-foreground/70'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <span className="ml-1 text-[10px] opacity-60">({tab.count})</span>
                {isActive && (
                  <motion.div
                    layoutId="profile-tab-indicator"
                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${tab.barColor}`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── PROJECT GRID ── */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {displayProjects.length > 0 ? (
              displayProjects.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
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
                    ownerUsername={p.user.username ?? null}
                    likeCount={p.likeCount ?? 0}
                    commentCount={p.commentCount ?? 0}
                    voteCount={p.voteCount ?? 0}
                    trendingScore={p.trendingScore ?? 0}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center py-20 text-center gap-4"
              >
                {activeTab === 'resurrected' ? (
                  <>
                    <Ghost className="h-10 w-10 text-muted-foreground/15" />
                    <p className="font-mono text-[12px] text-muted-foreground/40">
                      No resurrections yet. Dead projects are waiting.
                    </p>
                  </>
                ) : activeTab === 'shipped' ? (
                  <>
                    <Package className="h-10 w-10 text-muted-foreground/15" />
                    <p className="font-mono text-[12px] text-muted-foreground/40">
                      Nothing shipped yet. Keep building.
                    </p>
                  </>
                ) : (
                  <>
                    <Code2 className="h-10 w-10 text-muted-foreground/15" />
                    <p className="font-mono text-[12px] text-muted-foreground/40">
                      No projects created yet.
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}
