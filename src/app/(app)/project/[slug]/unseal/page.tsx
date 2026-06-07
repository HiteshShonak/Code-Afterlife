import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { UnsealClient } from './UnsealClient';

export default async function UnsealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      timeCapsules: true,
      user: true,
    },
  });

  if (!project) notFound();

  // Only allow unsealing if the project is DEAD or SHIPPED
  if (project.state !== 'DEAD' && project.state !== 'SHIPPED') {
    redirect(`/project/${project.slug}`);
  }

  return <UnsealClient project={project} capsules={project.timeCapsules} />;
}
