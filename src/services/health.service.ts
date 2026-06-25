import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { calculateHealth, getDecayState } from '@/lib/health-calculator';
import { stateMachine } from '@/lib/state-machine';
import { projectService } from './project.service';
import type { Project } from '@prisma/client';
import type { HealthCalculationInput, DecayState } from '@/types/health';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const healthService = {
  // calc health for one
  async recalculateOne(
    projectId: string
  ): Promise<{ health: number; decayState: DecayState } | undefined> {
    let project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      logger.warn(`Health recalculation skipped: project ${projectId} not found`);
      return;
    }

    project = await this.evaluateAndTransition(projectId, project);
    if (!project) {
      logger.warn(`Health recalculation skipped: project ${projectId} disappeared during transition`);
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
    const sixtyDaysAgo = new Date(now.getTime() - 2 * THIRTY_DAYS_MS);

    const [commitsThisMonth, commitsLastMonth] = await Promise.all([
      prisma.timelineEntry.count({
        where: {
          projectId,
          type: { not: 'SYSTEM_DECAY' },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.timelineEntry.count({
        where: {
          projectId,
          type: { not: 'SYSTEM_DECAY' },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ]);

    const input: HealthCalculationInput = {
      state: project.state,
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
      state: project.state,
    });

    return { health, decayState };
  },

  // calc health for all
  async recalculateAll(): Promise<{ processed: number; errors: number }> {
    const projects = await prisma.project.findMany({
      where: {
        state: { not: 'SHIPPED' },
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

  // check state change
  async evaluateAndTransition(
    projectId: string,
    projectSnapshot?: Pick<Project, 'state' | 'lastActivityAt' | 'createdAt'> & { id?: string }
  ): Promise<Project | null> {
    const project = projectSnapshot ?? await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) return null;

    const suggestedState = stateMachine.evaluateState(project);

    if (
      suggestedState &&
      suggestedState !== project.state &&
      stateMachine.canTransition(project.state, suggestedState, { source: 'health_cron' })
    ) {
      logger.info(`State transition for project ${projectId}`, {
        from: project.state,
        to: suggestedState,
      });
      return projectService.updateState(projectId, suggestedState, {
        source: 'health_cron',
      });
    }

    return prisma.project.findUnique({ where: { id: projectId } });
  },
};
