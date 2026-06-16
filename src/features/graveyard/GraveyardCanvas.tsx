'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ResurrectionModal } from '@/components/ResurrectionModal';
import type { Project, User } from '@prisma/client';

// Lazy-load the 49KB Three.js canvas — only after hydration
const OriginalGraveyardCanvas = dynamic(
  () => import('./OriginalGraveyardCanvas').then((m) => m.OriginalGraveyardCanvas),
  { ssr: false, loading: () => null },
);

import type { Project as MockProject } from './types';

interface GraveyardCanvasProps {
  projects: (Project & { user: User })[];
  isAuthenticated: boolean;
}

// graveyard canvas adapter
export function GraveyardCanvas({ projects, isAuthenticated }: GraveyardCanvasProps) {
  const [resurrectionTarget, setResurrectionTarget] = useState<{
    id: string;
    title: string;
    stack: string[];
    lineageDepth: number;
  } | null>(null);

  // map project
  const mappedProjects: MockProject[] = projects.map((p): MockProject => {
    // epitaph priority
    const rawReason = (p as any).deathReason as string | null | undefined;
    const quote = rawReason
      ? `"${rawReason}"`
      : p.description
        ? `"${p.description.slice(0, 80)}${p.description.length > 80 ? '...' : ''}"`
        : '"Abandoned to the void."';

    return {
      id: p.id,
      name: p.title,
      born: formatMonthYear(p.createdAt),
      died: formatMonthYear(p.lastActivityAt ?? p.updatedAt),
      diedAt: (p.lastActivityAt ?? p.updatedAt).getTime(),
      quote,
      status: 'DECEASED',
      timeCapsules: (p as any)._count?.timeCapsules ?? 0,
      soulConnections: (p as any)._count?.children ?? 0,
      viewCount: p.viewCount ?? 0,
      voteCount: p.voteCount ?? 0,
      slug: p.slug,
    };
  });

  const handleResurrect = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setResurrectionTarget({
      id: project.id,
      title: project.title,
      stack: project.stack,
      lineageDepth: project.lineageDepth,
    });
  };

  return (
    <>
      <OriginalGraveyardCanvas
        projects={mappedProjects}
        isAuthenticated={isAuthenticated}
        onResurrect={handleResurrect}
      />

      {resurrectionTarget && (
        <ResurrectionModal
          open={!!resurrectionTarget}
          onClose={() => setResurrectionTarget(null)}
          deadProject={resurrectionTarget}
        />
      )}
    </>
  );
}

function formatMonthYear(date: Date | null): string {
  if (!date) return 'Unknown';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
