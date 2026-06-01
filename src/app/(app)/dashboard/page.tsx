import { redirect } from 'next/navigation';
import { projectService } from '@/services/project.service';
import { DashboardClient } from './DashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Code Afterlife',
  description: 'Track and manage your software project lifecycle.',
};

/**
 * Dashboard server page.
 * Auth is guaranteed by layout — session is always valid here.
 * Fetches user projects and passes to DashboardClient.
 */
export default async function DashboardPage() {
  const { auth } = await import('@/lib/auth');
  const session = await auth();

  // Layout guarantees auth — but TypeScript needs the null check
  if (!session?.user?.id) redirect('/');

  const userId = session.user.id;
  const projects = await projectService.getUserProjects(userId);

  return (
    <DashboardClient
      projects={projects}
      user={{
        id: userId,
        name: session.user.name ?? null,
        username: session.user.username ?? null,
        image: session.user.image ?? null,
      }}
    />
  );
}
