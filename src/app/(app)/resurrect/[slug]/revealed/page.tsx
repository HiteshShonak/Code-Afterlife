import { notFound } from 'next/navigation';
import { projectService } from '@/services/project.service';
import { TestamentRevealedClient } from './TestamentRevealedClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Testament Revealed — Code Afterlife',
};

export default async function TestamentRevealedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Fetch the new child project
  const project = await projectService.getBySlug(slug);
  if (!project) notFound();

  // 2. Fetch the parent project to get the testament
  if (!project.parentProjectId) {
    // If it has no parent, this page shouldn't be accessed normally, but fallback just in case
    return <TestamentRevealedClient slug={slug} testament={null} />;
  }

  const { prisma } = await import('@/lib/prisma');
  const parentProject = await prisma.project.findUnique({
    where: { id: project.parentProjectId },
    select: { testament: true, title: true }
  });

  return (
    <TestamentRevealedClient 
      slug={slug} 
      testament={parentProject?.testament ?? null} 
      parentTitle={parentProject?.title ?? 'Unknown Project'} 
    />
  );
}
