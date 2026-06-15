import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

// user stats
export interface UserStats {
  // total created
  readonly created: number;
  // total resurrected
  readonly resurrected: number;
  // total shipped
  readonly shipped: number;
}

export const userService = {
  // get by id
  async getById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  // get by gh id
  async getByGithubId(githubId: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { githubId },
    });
  },

  // get by username
  async getByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  },

  // get stats
  async getStats(userId: string): Promise<UserStats> {
    const [created, resurrected, shipped] = await Promise.all([
      prisma.project.count({
        where: { userId },
      }),
      prisma.project.count({
        where: { resurrecterUserId: userId },
      }),
      prisma.project.count({
        where: { userId, state: 'SHIPPED' },
      }),
    ]);

    return { created, resurrected, shipped };
  },
};
