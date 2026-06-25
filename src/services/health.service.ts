import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { calculateHealth, getDecayState } from "@/lib/health-calculator";
import {
  ghFetch,
  getCommitDate,
  getGitHubFailureDetails,
  getLatestCommitDate,
  getPulseUntilDate,
  isGitHubRateLimitExceeded,
  sanitizeFutureDate,
  type GitHubCommit,
} from "@/lib/ai-pulse";
import { stateMachine } from "@/lib/state-machine";
import { projectService } from "./project.service";
import { HEALTH_CONFIG } from "@/config/health";
import { daysBetween } from "@/lib/utils";
import { ApiError } from "@/lib/api-error";
import type { Prisma, Project, ProjectState } from "@prisma/client";
import type { HealthCalculationInput, DecayState } from "@/types/health";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const HEALTH_FETCH_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const RECALCULATE_CONCURRENCY = 4;
const RECALCULATE_RETRIES = 2;

class GitHubRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubRateLimitError";
  }
}

function parseGitHubRepoUrl(
  url: string,
): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
}

export function deriveStateFromHealth(
  health: number,
  currentState: ProjectState,
  daysSinceActivity: number,
): ProjectState {
  if (currentState === "SHIPPED") return "SHIPPED";
  if (currentState === "DEAD") return "DEAD";

  if (daysSinceActivity >= HEALTH_CONFIG.deadDays) return "DEAD";
  if (daysSinceActivity >= HEALTH_CONFIG.stalledDays) return "STALLED";

  if (currentState === "BORN") return "BORN";

  if (health >= HEALTH_CONFIG.thresholds.stable) return "ACTIVE";
  return "STALLED";
}

function countCommitsSince(
  commits: readonly GitHubCommit[],
  since: Date,
  before?: Date,
): number {
  return commits.filter((commit) => {
    const commitDate = getCommitDate(commit);
    if (!commitDate) return false;
    if (commitDate < since) return false;
    if (before && commitDate >= before) return false;
    return true;
  }).length;
}

async function getGitHubHealthMetrics(
  project: Pick<Project, "id" | "githubRepoUrl" | "state">,
) {
  if (project.state === "DEAD") return null;
  if (!project.githubRepoUrl) return null;

  const repoInfo = parseGitHubRepoUrl(project.githubRepoUrl);
  if (!repoInfo) {
    logger.warn(
      `Health recalculation skipped GitHub fetch: invalid repo URL for project ${project.id}`,
      {
        githubRepoUrl: project.githubRepoUrl,
      },
    );
    return null;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
  const sixtyDaysAgo = new Date(now.getTime() - HEALTH_FETCH_DAYS_MS);
  const validCommitCutoff = getPulseUntilDate(now);
  const commitsRes = await ghFetch(
    `/repos/${repoInfo.owner}/${repoInfo.repo}/commits?since=${sixtyDaysAgo.toISOString()}&until=${now.toISOString()}&per_page=100`,
  );

  if (!commitsRes.ok) {
    if (isGitHubRateLimitExceeded(commitsRes)) {
      throw new GitHubRateLimitError(
        `GitHub rate limit exhausted while recalculating project ${project.id}`,
      );
    }

    logger.warn(
      `Health recalculation GitHub fetch failed for project ${project.id}`,
      {
        ...getGitHubFailureDetails(commitsRes),
        repo: `${repoInfo.owner}/${repoInfo.repo}`,
      },
    );
    return null;
  }

  const commits: GitHubCommit[] = await commitsRes.json();
  const validCommits = commits.filter((commit) => {
    const commitDate = getCommitDate(commit);
    return commitDate && commitDate <= validCommitCutoff;
  });

  return {
    commitsThisMonth: countCommitsSince(validCommits, thirtyDaysAgo),
    commitsLastMonth: countCommitsSince(
      validCommits,
      sixtyDaysAgo,
      thirtyDaysAgo,
    ),
    latestActivityAt: getLatestCommitDate(validCommits),
  };
}

function sumCommits(entries: { data: Prisma.JsonValue }[]): number {
  return entries.reduce((acc, entry) => {
    if (
      entry.data &&
      typeof entry.data === "object" &&
      !Array.isArray(entry.data) &&
      "commitCount" in entry.data
    ) {
      return acc + (Number(entry.data.commitCount) || 0);
    }
    return acc;
  }, 0);
}

function getMoreRecentDate(
  first: Date | null | undefined,
  second: Date | null | undefined,
): Date | null {
  if (!first) return second ?? null;
  if (!second) return first;
  return first > second ? first : second;
}

export const healthService = {
  async recalculateOne(
    projectId: string,
  ): Promise<{ health: number; decayState: DecayState } | undefined> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      logger.warn(
        `Health recalculation skipped: project ${projectId} not found`,
      );
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
    const sixtyDaysAgo = new Date(now.getTime() - 2 * THIRTY_DAYS_MS);
    const githubMetrics = await getGitHubHealthMetrics(project);

    const [thisMonthEntries, lastMonthEntries] = await Promise.all([
      prisma.timelineEntry.findMany({
        where: {
          projectId,
          type: { not: "SYSTEM_DECAY" },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { data: true },
      }),
      prisma.timelineEntry.findMany({
        where: {
          projectId,
          type: { not: "SYSTEM_DECAY" },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        select: { data: true },
      }),
    ]);

    const commitsThisMonth = sumCommits(thisMonthEntries);
    const commitsLastMonth = sumCommits(lastMonthEntries);
    const safeStoredActivityAt = sanitizeFutureDate(project.lastActivityAt, now);
    const effectiveLastActivityAt =
      githubMetrics?.latestActivityAt ?? safeStoredActivityAt;

    const input: HealthCalculationInput = {
      state: project.state,
      lastActivityAt: effectiveLastActivityAt,
      createdAt: project.createdAt,
      commitsThisMonth: githubMetrics?.commitsThisMonth ?? commitsThisMonth,
      commitsLastMonth: githubMetrics?.commitsLastMonth ?? commitsLastMonth,
    };

    const health = calculateHealth(input);
    const decayState = getDecayState(health);

    let appliedState = project.state;
    const returnVal: { health: number; decayState: DecayState } = {
      health,
      decayState,
    };

    for (let attempt = 0; attempt <= RECALCULATE_RETRIES; attempt++) {
      try {
        await prisma.$transaction(async (tx) => {
          const freshProject = await tx.project.findUnique({
            where: { id: projectId },
            select: {
              state: true,
              createdAt: true,
              lastActivityAt: true,
            },
          });

          if (!freshProject) {
            throw ApiError.notFound("Project not found");
          }

          const currentState = freshProject.state;
          const safeFreshActivityAt = sanitizeFutureDate(freshProject.lastActivityAt, now);
          const latestActivityAt = getMoreRecentDate(
            safeFreshActivityAt,
            githubMetrics?.latestActivityAt,
          );
          const shouldUseTimelineCounts =
            Boolean(safeFreshActivityAt) &&
            Boolean(githubMetrics?.latestActivityAt) &&
            safeFreshActivityAt!.getTime() >
              githubMetrics!.latestActivityAt!.getTime();

          const freshInput: HealthCalculationInput = {
            state: currentState,
            createdAt: freshProject.createdAt,
            lastActivityAt: latestActivityAt,
            commitsThisMonth: shouldUseTimelineCounts
              ? commitsThisMonth
              : (githubMetrics?.commitsThisMonth ?? commitsThisMonth),
            commitsLastMonth: shouldUseTimelineCounts
              ? commitsLastMonth
              : (githubMetrics?.commitsLastMonth ?? commitsLastMonth),
          };

          const freshHealth = calculateHealth(freshInput);
          const freshDecayState = getDecayState(freshHealth);
          const freshActivityRef = latestActivityAt || freshProject.createdAt;
          const freshDaysSince = daysBetween(freshActivityRef, new Date());
          const freshDesiredState = deriveStateFromHealth(
            freshHealth,
            currentState,
            freshDaysSince,
          );

          appliedState = currentState;
          if (freshDesiredState !== currentState) {
            try {
              stateMachine.validateTransition(currentState, freshDesiredState, {
                source: "health_cron",
              });
              appliedState = freshDesiredState;
            } catch (error) {
              logger.warn(
                `Health cron skipped invalid state transition for project ${projectId}`,
                {
                  from: currentState,
                  to: freshDesiredState,
                  error,
                },
              );
            }
          }

          if (appliedState !== currentState) {
            await projectService.updateState(projectId, appliedState, {
              source: "health_cron",
              tx,
            });
          }

          await tx.project.update({
            where: { id: projectId },
            data: {
              health: freshHealth,
              lastHealthUpdate: now,
              ...(githubMetrics?.latestActivityAt &&
              (!freshProject.lastActivityAt ||
                githubMetrics.latestActivityAt > freshProject.lastActivityAt)
                ? { lastActivityAt: githubMetrics.latestActivityAt }
                : {}),
            },
          });

          Object.assign(returnVal, {
            health: freshHealth,
            decayState: freshDecayState,
          });
        });

        break;
      } catch (error) {
        const isConflict =
          error instanceof ApiError && error.statusCode === 409;
        if (!isConflict || attempt === RECALCULATE_RETRIES) {
          throw error;
        }
      }
    }

    logger.info(`Health recalculated for project ${projectId}`, {
      health: returnVal.health,
      decayState: returnVal.decayState,
      commitsThisMonth: input.commitsThisMonth,
      desiredState: appliedState,
      state: appliedState,
      previousState: project.state,
      lastActivityAt: effectiveLastActivityAt?.toISOString() ?? null,
    });

    return returnVal;
  },

  async recalculateAll(): Promise<{ processed: number; errors: number }> {
    const projects = await prisma.project.findMany({
      select: { id: true },
    });

    let processed = 0;
    let errors = 0;
    let rateLimitReached = false;

    let cursor = 0;
    const worker = async () => {
      while (!rateLimitReached && cursor < projects.length) {
        const project = projects[cursor++];
        if (!project) continue;

        try {
          await this.recalculateOne(project.id);
          processed++;
        } catch (error) {
          if (error instanceof GitHubRateLimitError) {
            rateLimitReached = true;
            logger.warn(
              "Health recalculation stopped early because the GitHub rate limit was exhausted.",
            );
            continue;
          }

          errors++;
          logger.error(
            `Health recalculation failed for project ${project.id}`,
            { error },
          );
        }
      }
    };

    await Promise.all(
      Array.from(
        { length: Math.min(RECALCULATE_CONCURRENCY, projects.length) },
        () => worker(),
      ),
    );

    logger.info(`Health recalculation batch complete`, {
      processed,
      errors,
      total: projects.length,
      stoppedForRateLimit: rateLimitReached,
    });
    return { processed, errors };
  },
};
