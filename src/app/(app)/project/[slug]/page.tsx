import { notFound } from 'next/navigation';
import { projectService } from '@/services/project.service';
import { socialService } from '@/services/social.service';
import { ProjectDetailClient } from './ProjectDetailClient';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await projectService.getBySlug(slug);
    if (!project) return { title: 'Project Not Found | Code Afterlife' };
    return {
      title: `${project.title} | Code Afterlife`,
      description: project.description ?? `Track the lifecycle of ${project.title}.`,
      openGraph: {
        title: `${project.title} | Code Afterlife`,
        description: project.description ?? undefined,
      },
    };
  } catch {
    return { title: 'Project | Code Afterlife' };
  }
}

// project detail page
export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const project = await projectService.getBySlug(slug);
  if (!project) notFound();

  // Auth is optional
  let isOwner    = false;
  let userId: string | null = null;
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    userId  = session?.user?.id ?? null;
    isOwner = userId === project.userId;
  } catch {
    userId  = null;
    isOwner = false;
  }

  // Fetch social state - all in parallel
  const [initialLiked, initialFollowing, voteStats, { comments, nextCursor }] =
    await Promise.all([
      userId ? socialService.hasLiked(project.id, userId) : Promise.resolve(false),
      userId ? socialService.isFollowingProject(project.id, userId) : Promise.resolve(false),
      socialService.getVoteStats(project.id, userId ?? undefined),
      socialService.getComments(project.id),
    ]);

  return (
    <ProjectDetailClient
      project={project}
      isOwner={isOwner}
      currentUserId={userId}
      initialLiked={initialLiked}
      initialFollowing={initialFollowing}
      initialVoteStats={voteStats}
      initialComments={comments}
      commentsCursor={nextCursor}
    />
  );
}
