'use client';

import { useState, useTransition } from 'react';
import type { VoteType } from '@prisma/client';
import type { VoteStats } from '@/services/social.service';

// use vote hook
export function useVote(projectId: string, initialStats: VoteStats) {
  const [stats, setStats]        = useState<VoteStats>(initialStats);
  const [isPending, startTransition] = useTransition();

  const castVote = (vote: VoteType) => {
    if (isPending) return;

    // optim update
    const prev = stats;
    setStats((s) => {
      const isToggleOff = s.userVote === vote;
      if (isToggleOff) {
        return {
          ...s,
          willShip: vote === 'WILL_SHIP' ? s.willShip - 1 : s.willShip,
          willDie:  vote === 'WILL_DIE'  ? s.willDie  - 1 : s.willDie,
          total:    s.total - 1,
          userVote: null,
        };
      }
      // update vote
      const removingOld  = s.userVote !== null;
      return {
        ...s,
        willShip: vote === 'WILL_SHIP'
          ? s.willShip + 1
          : removingOld && s.userVote === 'WILL_SHIP' ? s.willShip - 1 : s.willShip,
        willDie: vote === 'WILL_DIE'
          ? s.willDie + 1
          : removingOld && s.userVote === 'WILL_DIE' ? s.willDie - 1 : s.willDie,
        total:   removingOld ? s.total : s.total + 1,
        userVote: vote,
      };
    });

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote }),
        });
        if (!res.ok) throw new Error('Vote failed');
        const json = await res.json();
        setStats(json.data);
      } catch {
        setStats(prev); // revert
      }
    });
  };

  return { stats, castVote, isPending };
}
