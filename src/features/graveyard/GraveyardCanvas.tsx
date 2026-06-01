'use client';

import { useState } from 'react';
import { OriginalGraveyardCanvas } from './OriginalGraveyardCanvas';
import { extendedMockProjects } from './mockData';
import { ResurrectionModal } from '@/components/ResurrectionModal';
import type { Project, User } from '@prisma/client';

/** Shape expected by OriginalGraveyardCanvas's mockData interface */
interface MockProject {
  id: string;
  name: string;
  born: string;
  died: string;
  quote: string;
  status: 'DECEASED' | 'RESURRECTED';
  timeCapsules: number;
  soulConnections: number;
  resurrectedBy?: {
    name: string;
    handle: string;
    date: string;
    avatarUrl: string;
  };
}

interface GraveyardCanvasProps {
  projects: (Project & { user: User })[];
  isAuthenticated: boolean;
}

/**
 * Adapter layer between real DB data and the 3D canvas component.
 * Maps Prisma Project shape → MockProject shape that OriginalGraveyardCanvas expects.
 * Manages resurrection modal state.
 *
 * This preserves the 3D cinematic experience while using real data.
 */
export function GraveyardCanvas({ projects, isAuthenticated }: GraveyardCanvasProps) {
  const [resurrectionTarget, setResurrectionTarget] = useState<{
    id: string;
    title: string;
    stack: string[];
    lineageDepth: number;
  } | null>(null);

  /** Map Prisma project → mock shape for the existing 3D canvas */
  const mappedProjects: MockProject[] = projects.map((p): MockProject => ({
    id: p.id,
    name: p.title,
    born: formatMonthYear(p.createdAt),
    died: formatMonthYear(p.lastActivityAt ?? p.updatedAt),
    quote: p.description ? `"${p.description.slice(0, 80)}${p.description.length > 80 ? '...' : ''}"` : '"Abandoned to the void."',
    status: 'DECEASED',
    timeCapsules: 0,
    soulConnections: p.lineageDepth,
  }));

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

  // Guarantee the graveyard always feels atmospheric and densely populated.
  // If the DB has only a few projects, an infinite empty field ruins immersion.
  const combinedProjects = [...mappedProjects, ...extendedMockProjects];

  return (
    <>
      <OriginalGraveyardCanvas
        projects={combinedProjects}
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
