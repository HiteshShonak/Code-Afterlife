import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { ForkSetupClient } from './ForkSetupClient';

export default async function ResurrectSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  const deadProject = await prisma.project.findUnique({
    where: { id },
    include: {
      user: {
        select: { username: true, name: true, image: true },
      },
    },
  });

  if (!deadProject) {
    notFound();
  }

  // Only DEAD projects can be resurrected
  if (deadProject.state !== 'DEAD') {
    redirect(`/project/${deadProject.slug}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 md:px-10 min-h-[calc(100vh-4rem)]">
      <div className="mb-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60 mb-2">
          Resurrection Protocol
        </p>
        <h1 className="font-mono text-3xl font-extrabold tracking-tight text-foreground">
          Revive "{deadProject.title}"
        </h1>
        <p className="mt-2 font-mono text-[12px] text-muted-foreground/70">
          This project has been dead for a while. It's time to give it a second life.
        </p>
      </div>

      <ForkSetupClient 
        deadProjectId={deadProject.id} 
        deadProjectTitle={deadProject.title}
        deadProjectStack={deadProject.stack}
        parentRepoUrl={deadProject.githubRepoUrl}
        testament={deadProject.testament}
      />
    </div>
  );
}
