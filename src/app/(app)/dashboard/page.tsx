import { redirect } from 'next/navigation';
import { projectService } from '@/services/project.service';
import { DashboardClient } from './DashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Code Afterlife',
  description: 'Track and manage your software project lifecycle.',
};

// dashboard page
export default async function DashboardPage() {
  const { auth } = await import('@/lib/auth');
  const session = await auth();

  // typescript null check
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
