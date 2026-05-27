import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

/** User activity statistics across the platform. */
export interface UserStats {
  /** Total projects created by this user. */
  readonly created: number;
  /** Total projects resurrected by this user. */
  readonly resurrected: number;
  /** Total projects shipped by this user. */
  readonly shipped: number;
}

export const userService = {
  /** Find a user by their database ID. */
  async getById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  /** Find a user by their GitHub ID (numeric). */
  async getByGithubId(githubId: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { githubId },
    });
  },

  /** Find a user by their GitHub username. */
  async getByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  },

  /**
   * Get platform activity statistics for a user.
   * Uses parallel queries for performance.
   */
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
