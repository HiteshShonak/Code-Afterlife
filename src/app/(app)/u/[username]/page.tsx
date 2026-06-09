import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { UserProfileClient } from './UserProfileClient';
import { requireAuth } from '@/lib/auth-guard';

export async function generateMetadata(props: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await props.params;
  return {
    title: `@${username} | Code Afterlife`,
  };
}

export default async function UserProfilePage(props: { params: Promise<{ username: string }> }) {
  const { username } = await props.params;
  const currentUser = await requireAuth().catch(() => null);

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      createdProjects: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
      resurrectedProjects: {
        include: { user: true },
        orderBy: { resurrectionDate: 'desc' },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Calculate Developer Health Score
  let totalActiveHealth = 0;
  let activeCount = 0;
  let deadCount = 0;
  let shippedCount = 0;

  for (const p of user.createdProjects) {
    if (p.state === 'ACTIVE' || p.state === 'STALLED' || p.state === 'BORN') {
      totalActiveHealth += p.health;
      activeCount++;
    } else if (p.state === 'DEAD') {
      deadCount++;
    } else if (p.state === 'SHIPPED') {
      shippedCount++;
    }
  }

  const avgHealth = activeCount > 0 ? totalActiveHealth / activeCount : 50;
  const resurrectedCount = user.resurrectedProjects.length;

  const healthScore = Math.max(0, Math.round(
    (avgHealth * 0.5) +
    (resurrectedCount * 10) +
    (shippedCount * 20) -
    (deadCount * 5)
  ));

  // Determine Necromancer Tier
  let necromancerTier = null;
  if (resurrectedCount >= 10) necromancerTier = 'Lich King';
  else if (resurrectedCount >= 5) necromancerTier = 'Master Necromancer';
  else if (resurrectedCount >= 2) necromancerTier = 'Adept';
  else if (resurrectedCount >= 1) necromancerTier = 'Initiate';

  return (
    <UserProfileClient
      profileUser={user}
      createdProjects={user.createdProjects as any}
      resurrectedProjects={user.resurrectedProjects as any}
      healthScore={healthScore}
      necromancerTier={necromancerTier}
      currentUserId={currentUser?.id ?? null}
    />
  );
}
