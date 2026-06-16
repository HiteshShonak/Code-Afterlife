'use client';

import { useState, useTransition } from 'react';

// use follow hook
export function useFollow(projectId: string, initialFollowing: boolean, initialFollowerCount: number = 0) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (isPending) return;

    const next = !following;
    setFollowing(next);
    setFollowerCount(prev => next ? prev + 1 : Math.max(0, prev - 1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/follow`, { method: 'POST' });
        if (!res.ok) throw new Error('Follow failed');
        const json = await res.json();
        setFollowing(json.data.following);
      } catch {
        setFollowing(!next); // revert
        setFollowerCount(prev => !next ? prev + 1 : Math.max(0, prev - 1));
      }
    });
  };

  return { following, followerCount, toggle, isPending };
}
