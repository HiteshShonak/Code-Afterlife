import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { calculateHealth, getDecayState } from '@/lib/health-calculator';
import { stateMachine } from '@/lib/state-machine';
import { projectService } from './project.service';
import type { HealthCalculationInput, DecayState } from '@/types/health';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const healthService = {
  /**
   * Recalculates the health score and decay state of a single project.
   * Compares timeline entry activity from this month against last month.
   */
  async recalculateOne(
    projectId: string
  ): Promise<{ health: number; decayState: DecayState } | undefined> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      logger.warn(`Health recalculation skipped: project ${projectId} not found`);
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
    const sixtyDaysAgo = new Date(now.getTime() - 2 * THIRTY_DAYS_MS);

    const [commitsThisMonth, commitsLastMonth] = await Promise.all([
      prisma.timelineEntry.count({
        where: {
          projectId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.timelineEntry.count({
        where: {
          projectId,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ]);

    const input: HealthCalculationInput = {
      lastActivityAt: project.lastActivityAt,
      createdAt: project.createdAt,
      commitsThisMonth,
      commitsLastMonth,
    };

    const health = calculateHealth(input);
    const decayState = getDecayState(health);

    await projectService.updateHealth(projectId, health);

    logger.info(`Health recalculated for project ${projectId}`, {
      health,
      decayState,
      commitsThisMonth,
    });

    // Evaluate state transitions based on new health
    await this.evaluateAndTransition(projectId);

    return { health, decayState };
  },

  /**
   * Recalculates health scores and decay states for all active projects.
   * Skip projects in terminal states (SHIPPED, DEAD).
   */
  async recalculateAll(): Promise<{ processed: number; errors: number }> {
    const projects = await prisma.project.findMany({
      where: {
        state: { notIn: ['SHIPPED', 'DEAD'] },
      },
      select: { id: true },
    });

    let processed = 0;
    let errors = 0;

    for (const project of projects) {
      try {
        await this.recalculateOne(project.id);
        processed++;
      } catch (error) {
        errors++;
        logger.error(`Health recalculation failed for project ${project.id}`, { error });
      }
    }

    logger.info(`Health recalculation batch complete`, { processed, errors, total: projects.length });
    return { processed, errors };
  },

  /**
   * Evaluates the lifecycle state of a project and transitions it if necessary.
   */
  async evaluateAndTransition(projectId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) return;

    const suggestedState = stateMachine.evaluateState(project);

    if (suggestedState && suggestedState !== project.state) {
      logger.info(`State transition for project ${projectId}`, {
        from: project.state,
        to: suggestedState,
      });
      await projectService.updateState(projectId, suggestedState);
    }
  },
};

