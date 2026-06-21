'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Rocket, Skull } from 'lucide-react';
import { useVote } from '@/hooks/use-vote';
import type { VoteStats } from '@/services/social.service';

interface VoteBarProps {
  projectId:    string;
  initialStats: VoteStats;
  isLoggedIn:   boolean;
}

// vote bar
export function VoteBar({ projectId, initialStats, isLoggedIn }: VoteBarProps) {
  const router = useRouter();
  const { stats, castVote, isPending } = useVote(projectId, initialStats);

  const shipPct = stats.total > 0 ? Math.round((stats.willShip / stats.total) * 100) : 50;
  const diePct  = 100 - shipPct;

  const handleVote = (vote: 'WILL_SHIP' | 'WILL_DIE') => {
    if (!isLoggedIn) {
      router.push('/');
      return;
    }
    castVote(vote);
  };

  return (
    <div className="space-y-4">
      {/* buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleVote('WILL_SHIP')}
          disabled={isPending}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 font-mono text-[12px] font-semibold tracking-wide transition-all duration-200',
            stats.userVote === 'WILL_SHIP'
              ? 'border-blue-500/40 bg-blue-500/15 text-blue-400 shadow-md shadow-blue-500/10'
              : 'border-border/60 bg-card/60 text-muted-foreground hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/[0.05]',
            isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          ].join(' ')}
          aria-label="Vote will ship"
        >
          <Rocket className="h-4 w-4" />
          Will Ship
          <span className="ml-1 font-bold text-blue-400">{stats.willShip}</span>
        </button>

        <button
          onClick={() => handleVote('WILL_DIE')}
          disabled={isPending}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 font-mono text-[12px] font-semibold tracking-wide transition-all duration-200',
            stats.userVote === 'WILL_DIE'
              ? 'border-red-500/40 bg-red-500/15 text-red-400 shadow-md shadow-red-500/10'
              : 'border-border/60 bg-card/60 text-muted-foreground hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/[0.05]',
            isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          ].join(' ')}
          aria-label="Vote will die"
        >
          <Skull className="h-4 w-4" />
          Will Die
          <span className="ml-1 font-bold text-red-400">{stats.willDie}</span>
        </button>
      </div>

      {/* progress bar */}
      {stats.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
            <motion.div
              className="h-full rounded-l-full bg-blue-500/60"
              initial={{ width: 0 }}
              animate={{ width: `${shipPct}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="h-full rounded-r-full bg-red-500/60"
              initial={{ width: 0 }}
              animate={{ width: `${diePct}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground/50">
            <span>{shipPct}% will ship</span>
            <span className="text-muted-foreground/40">{stats.total} vote{stats.total !== 1 ? 's' : ''}</span>
            <span>{diePct}% will die</span>
          </div>
        </div>
      )}

      {stats.total === 0 && (
        <p className="text-center font-mono text-[11px] text-muted-foreground/40">
          No votes yet - be the first to predict.
        </p>
      )}

      {!isLoggedIn && (
        <p className="text-center font-mono text-[10px] text-muted-foreground/40">
          <a href="/" className="text-accent/60 underline-offset-2 hover:underline">Sign in</a> to vote
        </p>
      )}
    </div>
  );
}
