'use client';

import { useState, useTransition } from 'react';

/**
 * useFollow — Optimistic project follow toggle.
 */
export function useFollow(projectId: string, initialFollowing: boolean) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (isPending) return;

    const next = !following;
    setFollowing(next);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/follow`, { method: 'POST' });
        if (!res.ok) throw new Error('Follow failed');
        const json = await res.json();
        setFollowing(json.data.following);
      } catch {
        setFollowing(!next); // Revert
      }
    });
  };

  return { following, toggle, isPending };
}
