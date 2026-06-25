// social logic

import { prisma } from '@/lib/prisma';
import type { VoteType } from '@prisma/client';

// trending score

// recalc trending
export async function recalculateTrending(
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  projectId: string,
): Promise<void> {
  const project = await tx.project.findUnique({
    where: { id: projectId },
    select: { likeCount: true, commentCount: true, voteCount: true, health: true, createdAt: true },
  });
  if (!project) return;

  const ageHours = (Date.now() - project.createdAt.getTime()) / 3_600_000;
  const score =
    (project.likeCount * 3 + project.commentCount * 2 + project.voteCount * 1 + project.health * 0.5) /
    Math.pow(ageHours + 2, 1.5);

  await tx.project.update({
    where: { id: projectId },
    data: { trendingScore: score },
  });
}

// likes

export interface LikeResult {
  liked:     boolean;
  likeCount: number;
}

export const socialService = {
  // likes

  async toggleLike(projectId: string, userId: string): Promise<LikeResult> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.projectLike.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

      let liked: boolean;

      if (existing) {
        // remove like
        await tx.projectLike.delete({
          where: { projectId_userId: { projectId, userId } },
        });
        await tx.project.update({
          where: { id: projectId },
          data: { likeCount: { decrement: 1 } },
        });
        liked = false;
      } else {
        // add like
        await tx.projectLike.create({ data: { projectId, userId } });
        await tx.project.update({
          where: { id: projectId },
          data: { likeCount: { increment: 1 } },
        });
        liked = true;
      }

      await recalculateTrending(tx, projectId);

      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { likeCount: true },
      });

      return { liked, likeCount: project?.likeCount ?? 0 };
    });
  },

  // check like
  async hasLiked(projectId: string, userId: string): Promise<boolean> {
    const like = await prisma.projectLike.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return !!like;
  },

  // comments

  async getComments(
    projectId: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ comments: CommentWithUser[]; nextCursor: string | null }> {
    const comments = await prisma.projectComment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    const hasMore = comments.length > limit;
    const page = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { comments: page as CommentWithUser[], nextCursor };
  },

  async createComment(
    projectId: string,
    userId: string,
    content: string,
  ): Promise<CommentWithUser> {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.projectComment.create({
        data: { projectId, userId, content },
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: { commentCount: { increment: 1 } },
      });

      await recalculateTrending(tx, projectId);
      return comment as CommentWithUser;
    });
  },

  async deleteComment(commentId: string, requesterId: string): Promise<void> {
    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
      select: { userId: true, projectId: true },
    });
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== requesterId) throw new Error('Forbidden');

    await prisma.$transaction(async (tx) => {
      await tx.projectComment.delete({ where: { id: commentId } });
      await tx.project.update({
        where: { id: comment.projectId },
        data: { commentCount: { decrement: 1 } },
      });
      await recalculateTrending(tx, comment.projectId);
    });
  },

  // votes

  async castVote(projectId: string, userId: string, vote: VoteType): Promise<VoteStats> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.projectVote.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

      if (existing) {
        if (existing.vote === vote) {
          // remove vote
          await tx.projectVote.delete({
            where: { projectId_userId: { projectId, userId } },
          });
          await tx.project.update({
            where: { id: projectId },
            data: { voteCount: { decrement: 1 } },
          });
        } else {
          // change vote
          await tx.projectVote.update({
            where: { projectId_userId: { projectId, userId } },
            data: { vote },
          });
        }
      } else {
        // new vote
        await tx.projectVote.create({ data: { projectId, userId, vote } });
        await tx.project.update({
          where: { id: projectId },
          data: { voteCount: { increment: 1 } },
        });
      }

      await recalculateTrending(tx, projectId);

      // updated stats
      const votes = await tx.projectVote.findMany({ where: { projectId } });
      const userVote = await tx.projectVote.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

      return {
        willShip:  votes.filter((v) => v.vote === 'WILL_SHIP').length,
        willDie:   votes.filter((v) => v.vote === 'WILL_DIE').length,
        total:     votes.length,
        userVote:  userVote?.vote ?? null,
      };
    });
  },

  async getVoteStats(projectId: string, userId?: string): Promise<VoteStats> {
    const [votes, userVote] = await Promise.all([
      prisma.projectVote.findMany({ where: { projectId } }),
      userId
        ? prisma.projectVote.findUnique({
            where: { projectId_userId: { projectId, userId } },
          })
        : null,
    ]);

    return {
      willShip: votes.filter((v) => v.vote === 'WILL_SHIP').length,
      willDie:  votes.filter((v) => v.vote === 'WILL_DIE').length,
      total:    votes.length,
      userVote: userVote?.vote ?? null,
    };
  },

  // project follow

  async toggleProjectFollow(
    projectId: string,
    userId: string,
  ): Promise<{ following: boolean }> {
    const existing = await prisma.projectFollow.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (existing) {
      await prisma.projectFollow.delete({
        where: { userId_projectId: { userId, projectId } },
      });
      return { following: false };
    } else {
      await prisma.projectFollow.create({ data: { userId, projectId } });
      return { following: true };
    }
  },

  async isFollowingProject(projectId: string, userId: string): Promise<boolean> {
    const follow = await prisma.projectFollow.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    return !!follow;
  },

  // user follow

  async toggleUserFollow(
    targetUserId: string,
    currentUserId: string,
  ): Promise<{ following: boolean }> {
    if (targetUserId === currentUserId) throw new Error('Cannot follow yourself');

    const existing = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
    });

    if (existing) {
      await prisma.userFollow.delete({
        where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
      });
      return { following: false };
    } else {
      await prisma.userFollow.create({
        data: { followerId: currentUserId, followingId: targetUserId },
      });
      return { following: true };
    }
  },
};

// types

export interface CommentWithUser {
  id:        string;
  projectId: string;
  userId:    string;
  content:   string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id:       string;
    name:     string | null;
    username: string | null;
    image:    string | null;
  };
}

export interface VoteStats {
  willShip: number;
  willDie:  number;
  total:    number;
  userVote: VoteType | null;
}
