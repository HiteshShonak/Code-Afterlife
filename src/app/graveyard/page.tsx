import type { Metadata } from 'next';
import { projectService } from '@/services/project.service';
import { GraveyardCanvas } from '@/features/graveyard/GraveyardCanvas';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Graveyard — Code Afterlife',
  description: 'A cinematic archive of abandoned software projects. Some await resurrection.',
};

// graveyard page
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
    // fallback empty state
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
