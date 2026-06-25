import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { asyncHandler } from "@/lib/async-handler";
import { apiResponse } from "@/lib/api-response";
import {
  ghFetch,
  calcHealthFromCommits,
  generatePulse,
  getGitHubFailureDetails,
  getFreshCommitsForPulse,
  getLatestCommitDate,
  getPulseLifecycleContext,
  getPulseSinceDate,
  getPulseUntilDate,
  isGitHubRateLimitExceeded,
  isOwnerAuthoredCommit,
  type GitHubCommit,
} from "@/lib/ai-pulse";
import { projectService } from "@/services/project.service";

export const maxDuration = 60; // vercel serverless limit

async function runAiPulse(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    logger.warn("Unauthorized cron attempt on /api/cron/ai-pulse");
    return apiResponse.error("Unauthorized", 401);
  }

  const now = new Date();

  if (!process.env.GITHUB_TOKEN) {
    logger.warn(
      "[AI Pulse] GITHUB_TOKEN is not set. GitHub API calls will use unauthenticated rate limits (60 req/hour). Cron may fail for projects with many repos.",
    );
  }
  if (!process.env.GROQ_API_KEY) {
    logger.warn(
      "[AI Pulse] GROQ_API_KEY is not set. AI-generated pulse summaries will be skipped and fallback text will be used.",
    );
  }

  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

  const candidates = await prisma.project.findMany({
    where: {
      state: { in: ["BORN", "ACTIVE", "STALLED", "DEAD", "SHIPPED"] },
      githubRepoUrl: { contains: "github.com" },
      OR: [
        { lastPulseCheckAt: null },
        { lastPulseCheckAt: { lt: twentyHoursAgo } },
      ],
    },
    select: {
      id: true,
      title: true,
      state: true,
      health: true,
      githubRepoUrl: true,
      createdAt: true,
      lastActivityAt: true,
      lastPulseCheckAt: true,
      user: {
        select: {
          githubId: true,
          username: true,
        },
      },
    },
  });

  if (!candidates.length) {
    return apiResponse.success(
      { checked: 0, results: [] },
      "No projects due for a pulse check.",
    );
  }

  const results: { id: string; action: string }[] = [];
  let githubRateLimited = false;

  for (const project of candidates) {
    if (githubRateLimited) {
      results.push({ id: project.id, action: "github_rate_limited_skipped" });
      continue;
    }

    try {
      const match = project.githubRepoUrl.match(
        /github\.com\/([^/]+)\/([^/]+)/,
      );
      if (!match) {
        logger.warn(`[AI Pulse] Invalid GitHub URL for project ${project.id}`, {
          githubRepoUrl: project.githubRepoUrl,
        });
        results.push({ id: project.id, action: "invalid_github_url" });
        continue;
      }
      const [, owner, repoRaw] = match;
      const repo = repoRaw.replace(/\.git$/, "");

      const sinceDate = getPulseSinceDate(project, now);
      const untilDate = getPulseUntilDate(now);
      const commitsRes = await ghFetch(
        `/repos/${owner}/${repo}/commits?since=${sinceDate.toISOString()}&until=${untilDate.toISOString()}&per_page=100`,
      );

      const pulseUpdate = { lastPulseCheckAt: now };

      if (!commitsRes.ok) {
        logger.warn(
          `[AI Pulse] GitHub commit fetch failed for project ${project.id}`,
          {
            ...getGitHubFailureDetails(commitsRes),
          },
        );
        if (isGitHubRateLimitExceeded(commitsRes)) {
          githubRateLimited = true;
          results.push({ id: project.id, action: "github_rate_limited" });
        } else {
          await prisma.project.update({
            where: { id: project.id },
            data: pulseUpdate,
          });
          results.push({ id: project.id, action: "github_fetch_failed" });
        }
        continue;
      }

      const commits: GitHubCommit[] = await commitsRes.json();
      const freshCommits = getFreshCommitsForPulse(commits, project, now);

      if (freshCommits.length === 0) {
        await prisma.project.update({
          where: { id: project.id },
          data: pulseUpdate,
        });
        results.push({
          id: project.id,
          action: commits.length === 0 ? "no_commits" : "stale_commits_ignored",
        });
        continue;
      }

      let readme: string | null = null;
      try {
        const readmeRes = await ghFetch(`/repos/${owner}/${repo}/readme`);
        if (readmeRes.ok) {
          const readmeData = await readmeRes.json();
          readme = Buffer.from(readmeData.content, "base64").toString("utf-8");
        }
      } catch {
      }

      const ownerCommits = freshCommits.filter((commit) =>
        isOwnerAuthoredCommit(commit, project.user),
      );
      const initialLifecycle = getPulseLifecycleContext(project.state);
      const initialActivityCommits = initialLifecycle.shouldActivate
        ? ownerCommits
        : freshCommits;
      const commitMessages = initialActivityCommits.map(
        (commit) => commit.commit?.message ?? "",
      );

      const summary = await generatePulse(
        project.title,
        commitMessages,
        readme,
        initialLifecycle.isDeadResurrection,
      );
      if (!summary && process.env.GROQ_API_KEY) {
        logger.warn(
          `[AI Pulse] Proceeding without generated summary for project ${project.id}`,
        );
      }

      let action: string = "error";
      await prisma.$transaction(async (tx) => {
        const currentProject = await tx.project.findUnique({
          where: { id: project.id },
          select: {
            state: true,
            health: true,
            createdAt: true,
            lastActivityAt: true,
          },
        });

        if (!currentProject) {
          throw new Error(`Project ${project.id} disappeared during ai pulse`);
        }

        const lifecycle = getPulseLifecycleContext(currentProject.state);
        const currentFreshCommits = getFreshCommitsForPulse(
          commits,
          {
            createdAt: currentProject.createdAt,
            lastActivityAt: currentProject.lastActivityAt,
            lastPulseCheckAt: project.lastPulseCheckAt,
          },
          now,
        );
        const currentOwnerCommits = currentFreshCommits.filter((commit) =>
          isOwnerAuthoredCommit(commit, project.user),
        );
        const activityCommits = lifecycle.shouldActivate
          ? currentOwnerCommits
          : currentFreshCommits;

        if (currentFreshCommits.length === 0) {
          await tx.project.update({
            where: { id: project.id },
            data: pulseUpdate,
          });
          action = "stale_commits_ignored";
          return;
        }

        if (lifecycle.shouldActivate && currentOwnerCommits.length === 0) {
          await tx.project.update({
            where: { id: project.id },
            data: pulseUpdate,
          });
          action = "no_owner_commits";
          return;
        }

        const latestActivityAt = getLatestCommitDate(activityCommits);
        if (!latestActivityAt) {
          await tx.project.update({
            where: { id: project.id },
            data: pulseUpdate,
          });
          action = "commits_missing_dates";
          return;
        }

        if (lifecycle.shouldActivate) {
          await projectService.updateState(project.id, "ACTIVE", {
            source: "ai_pulse",
            tx,
          });
        }

        const storedState = lifecycle.shouldActivate
          ? "ACTIVE"
          : currentProject.state;
        const newHealth = calcHealthFromCommits(
          activityCommits.length,
          currentProject.health,
          storedState,
        );

        const storedLastActivityAt =
          currentProject.lastActivityAt &&
          currentProject.lastActivityAt > latestActivityAt
            ? currentProject.lastActivityAt
            : latestActivityAt;

        await tx.project.update({
          where: { id: project.id },
          data: {
            ...pulseUpdate,
            lastActivityAt: storedLastActivityAt,
            health: newHealth,
          },
        });

        const fallbackDescription = lifecycle.isDeadResurrection
          ? `The original author came back and pushed ${currentOwnerCommits.length} new commit${currentOwnerCommits.length > 1 ? "s" : ""}. The project stirs back to life.`
          : lifecycle.shouldActivate
            ? `The original author pushed ${currentOwnerCommits.length} new commit${currentOwnerCommits.length > 1 ? "s" : ""}, and the project woke back up.`
            : `${activityCommits.length} new commit${activityCommits.length > 1 ? "s" : ""} landed in the repository.`;
        const canUseGeneratedSummary =
          lifecycle.shouldActivate === initialLifecycle.shouldActivate &&
          lifecycle.isDeadResurrection ===
            initialLifecycle.isDeadResurrection &&
          activityCommits.length === initialActivityCommits.length;
        const description = canUseGeneratedSummary
          ? (summary ?? fallbackDescription)
          : fallbackDescription;

        if (lifecycle.isDeadResurrection) {
          await tx.timelineEntry.create({
            data: {
              projectId: project.id,
              type: "AI_BUILD_LOG",
              title: "Original Author Returned",
              description,
              data: {
                commitCount: currentOwnerCommits.length,
                repo: `${owner}/${repo}`,
                latestCommitAt: latestActivityAt.toISOString(),
              },
            },
          });
          action = "resurrected";
        } else {
          await tx.timelineEntry.create({
            data: {
              projectId: project.id,
              type: "AI_BUILD_LOG",
              title: lifecycle.shouldActivate
                ? "AI Pulse Activation"
                : "AI Pulse Observation",
              description,
              data: {
                commitCount: activityCommits.length,
                ownerCommitCount: currentOwnerCommits.length,
                repo: `${owner}/${repo}`,
                latestCommitAt: latestActivityAt.toISOString(),
              },
            },
          });
          action = lifecycle.shouldActivate ? "activated" : "pulse_written";
        }
      });

      results.push({ id: project.id, action });
    } catch (err) {
      logger.error(`[AI Pulse] Failed project ${project.id}`, { error: err });
      results.push({ id: project.id, action: "error" });
    }
  }

  return apiResponse.success(
    { checked: candidates.length, results },
    "[AI Pulse] complete",
  );
}

export const GET = asyncHandler(runAiPulse);
