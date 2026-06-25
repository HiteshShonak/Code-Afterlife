import { notFound } from 'next/navigation';
import Link from 'next/link';
import { projectService } from '@/services/project.service';
import { socialService } from '@/services/social.service';
import { ProjectDetailClient } from './ProjectDetailClient';
import type { Metadata } from 'next';
import type { CommentWithUser, VoteStats } from '@/services/social.service';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const EMPTY_VOTE_STATS: VoteStats = {
  willShip: 0,
  willDie: 0,
  total: 0,
  userVote: null,
};

function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: unknown; message?: unknown };
  if (candidate.code === 'P1001') return true;

  return typeof candidate.message === 'string'
    && candidate.message.includes("Can't reach database server");
}

async function withDatabaseFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) return fallback;
    throw error;
  }
}

function ProjectUnavailable({ slug }: { slug: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16 text-center sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-card/50 p-6 shadow-2xl shadow-black/20 sm:p-8">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
          Project temporarily unavailable
        </p>
        <h1 className="font-mono text-xl font-semibold text-foreground sm:text-2xl">
          The archive could not be reached.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The database is not responding right now. Try again in a moment, or head back to explore while it reconnects.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-sm border border-foreground/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground/8"
          >
            Explore
          </Link>
          <Link
            href={`/project/${slug}`}
            className="inline-flex items-center justify-center rounded-sm border border-transparent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
          >
            Try again
          </Link>
        </div>
      </div>
    </main>
  );
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

  let project;
  try {
    project = await projectService.getBySlug(slug);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) return <ProjectUnavailable slug={slug} />;
    throw error;
  }

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
  const emptyCommentsPage: { comments: CommentWithUser[]; nextCursor: string | null } = {
    comments: [],
    nextCursor: null,
  };

  const [initialLiked, initialFollowing, voteStats, { comments, nextCursor }] =
    await Promise.all([
      userId ? withDatabaseFallback(socialService.hasLiked(project.id, userId), false) : Promise.resolve(false),
      userId ? withDatabaseFallback(socialService.isFollowingProject(project.id, userId), false) : Promise.resolve(false),
      withDatabaseFallback(socialService.getVoteStats(project.id, userId ?? undefined), EMPTY_VOTE_STATS),
      withDatabaseFallback(socialService.getComments(project.id), emptyCommentsPage),
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
