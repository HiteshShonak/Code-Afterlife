import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { LegacyClient } from './LegacyClient';
import { requireAuth } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Hall of Legacy | Code Afterlife',
  description: 'The golden archives of shipped projects.',
};

export const dynamic = 'force-dynamic';

export default async function LegacyPage() {
  const user = await requireAuth().catch(() => null);
  
  // Fetch SHIPPED projects, sorted by likeCount
  const projects = await prisma.project.findMany({
    where: { state: 'SHIPPED' },
    orderBy: { likeCount: 'desc' },
    include: { user: true },
    take: 50,
  });

  return <LegacyClient projects={projects as any} currentUserId={user?.id ?? null} />;
}
