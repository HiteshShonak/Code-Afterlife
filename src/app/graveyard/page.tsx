import type { Metadata } from 'next';
import { projectService } from '@/services/project.service';
import { GraveyardCanvas } from '@/features/graveyard/GraveyardCanvas';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Graveyard — Code Afterlife',
  description: 'A cinematic archive of abandoned software projects. Some await resurrection.',
};

/**
 * Graveyard page — server component.
 * Fetches real dead projects from DB and auth status.
 * Falls back gracefully if DB is not yet configured.
 */
export default async function GraveyardPage() {
  let deadProjects: Awaited<ReturnType<typeof projectService.getDeadProjects>> = [];
  let isAuthenticated = false;

  try {
    const { auth } = await import('@/lib/auth');
    const [session, projects] = await Promise.all([
      auth(),
      projectService.getDeadProjects(),
    ]);
    deadProjects = projects;
    isAuthenticated = !!session?.user?.id;
  } catch {
    // DB not configured — render graveyard with empty state
    deadProjects = [];
    isAuthenticated = false;
  }

  return (
    <GraveyardCanvas
      projects={deadProjects}
      isAuthenticated={isAuthenticated}
    />
  );
}
