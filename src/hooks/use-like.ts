'use client';

import { useState, useTransition } from 'react';

/**
 * useLike — Optimistic like/unlike toggle.
 *
 * Pattern per engineering-patterns.md:
 *   - Optimistic update immediately on click
 *   - Reverts on server error
 *   - No full page reload
 *
 * @param projectId  - ID of the project (NOT slug)
 * @param initialLiked  - Server-rendered initial state
 * @param initialCount  - Server-rendered initial count
 */
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

    // Optimistic update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/like`, { method: 'POST' });
        if (!res.ok) throw new Error('Like failed');
        const json = await res.json();
        // Sync with server truth
        setLiked(json.data.liked);
        setLikeCount(json.data.likeCount);
      } catch {
        // Revert on error
        setLiked(!nextLiked);
        setLikeCount((c) => c + (nextLiked ? -1 : 1));
      }
    });
  };

  return { liked, likeCount, toggle, isPending };
}
