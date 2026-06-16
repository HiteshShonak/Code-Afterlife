'use client';

import { useState, useTransition } from 'react';

// use like hook
export function useLike(
  projectId: string,
  initialLiked: boolean,
  initialCount: number,
) {
  const [liked, setLiked]         = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (isPending) return;

    // optim update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/like`, { method: 'POST' });
        if (!res.ok) throw new Error('Like failed');
        const json = await res.json();
        // sync server truth
        setLiked(json.data.liked);
        setLikeCount(json.data.likeCount);
      } catch {
        // revert on error
        setLiked(!nextLiked);
        setLikeCount((c) => c + (nextLiked ? -1 : 1));
      }
    });
  };

  return { liked, likeCount, toggle, isPending };
}
