import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
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
import { healthService } from "@/services/health.service";
import { HEALTH_CONFIG } from "@/config/health";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        userId: true,
        githubRepoUrl: true,
        state: true,
        health: true,
        title: true,
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

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!project.githubRepoUrl) {
      return NextResponse.json(
        {
          message:
            "No GitHub URL attached to this project. Cannot run AI Fetch.",
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const limitAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const recentAILogs = await prisma.timelineEntry.findMany({
      where: {
        projectId: id,
        type: { in: ["AI_BUILD_LOG", "RESURRECTION"] },
        createdAt: { gte: limitAgo },
      },
    });

    const recentManualLog = recentAILogs.find((log) => {
      if (
        log.data &&
        typeof log.data === "object" &&
        "manualTrigger" in log.data
      ) {
        return log.data.manualTrigger === true;
      }
      return false;
    });

    if (recentManualLog) {
      return NextResponse.json(
        {
          message:
            "An AI Pulse has already run recently. Please wait 6 hours to manually force it again.",
        },
        { status: 429 },
      );
    }

    const match = project.githubRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json(
        { message: "Invalid GitHub URL format." },
        { status: 400 },
      );
    }

    const [, owner, repoRaw] = match;
    const repo = repoRaw.replace(/\.git$/, "");

    const sinceDate = getPulseSinceDate(project, now);
    const untilDate = getPulseUntilDate(now);
    const commitsRes = await ghFetch(
      `/repos/${owner}/${repo}/commits?since=${sinceDate.toISOString()}&until=${untilDate.toISOString()}&per_page=100`,
    );

    if (!commitsRes.ok) {
      logger.warn(
        `[AI Pulse] Manual GitHub commit fetch failed for project ${id}`,
        {
          ...getGitHubFailureDetails(commitsRes),
        },
      );
      if (isGitHubRateLimitExceeded(commitsRes)) {
        return NextResponse.json(
          {
            message: "GitHub API rate limit exhausted. Please try again later.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { message: "Failed to fetch commits from GitHub." },
        { status: 502 },
      );
    }

    const commits: GitHubCommit[] = await commitsRes.json();
    const freshCommits = getFreshCommitsForPulse(commits, project, now);

    if (freshCommits.length === 0) {
      await prisma.project.update({
        where: { id },
        data: { lastPulseCheckAt: now },
      });
      return NextResponse.json(
        {
          message:
            commits.length === 0
              ? "No new commits found since the last check."
              : `Only stale commits were found. Lifecycle activity requires commits from the last ${HEALTH_CONFIG.deadDays} days.`,
        },
        { status: 400 },
      );
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

    let entry = null;
    let failureMessage: string | null = null;
    await prisma.$transaction(async (tx) => {
      const currentProject = await tx.project.findUnique({
        where: { id },
        select: {
          state: true,
          health: true,
          createdAt: true,
          lastActivityAt: true,
        },
      });

      if (!currentProject) {
        throw new Error(`Project ${id} disappeared during ai pulse`);
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
          where: { id },
          data: { lastPulseCheckAt: now },
        });
        failureMessage =
          "Only stale commits were found. Another pulse may have already recorded them.";
        return;
      }

      if (lifecycle.shouldActivate && currentOwnerCommits.length === 0) {
        await tx.project.update({
          where: { id },
          data: { lastPulseCheckAt: now },
        });
        failureMessage =
          "Recent commits were found, but none were authored by the project owner, so the lifecycle state was left unchanged.";
        return;
      }

      const latestActivityAt = getLatestCommitDate(activityCommits);
      if (!latestActivityAt) {
        await tx.project.update({
          where: { id },
          data: { lastPulseCheckAt: now },
        });
        failureMessage =
          "Fresh commits were found, but none had usable timestamps.";
        return;
      }

      if (lifecycle.shouldActivate) {
        await projectService.updateState(id, "ACTIVE", {
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
        where: { id },
        data: {
          lastPulseCheckAt: now,
          lastActivityAt: storedLastActivityAt,
          health: newHealth,
        },
      });

      const fallbackDescription = lifecycle.isDeadResurrection
        ? `The original author came back and pushed ${currentOwnerCommits.length} new commit(s). The project stirs back to life.`
        : lifecycle.shouldActivate
          ? `The original author pushed ${currentOwnerCommits.length} new commit(s), and the project woke back up.`
          : `${activityCommits.length} new commit(s) landed in the repository.`;
      const canUseGeneratedSummary =
        lifecycle.shouldActivate === initialLifecycle.shouldActivate &&
        lifecycle.isDeadResurrection === initialLifecycle.isDeadResurrection &&
        activityCommits.length === initialActivityCommits.length;
      const description = canUseGeneratedSummary
        ? (summary ?? fallbackDescription)
        : fallbackDescription;

      if (lifecycle.isDeadResurrection) {
        entry = await tx.timelineEntry.create({
          data: {
            projectId: id,
            type: "AI_BUILD_LOG",
            title: "Original Author Returned",
            description,
            data: {
              commitCount: currentOwnerCommits.length,
              repo: `${owner}/${repo}`,
              latestCommitAt: latestActivityAt.toISOString(),
              manualTrigger: true,
            },
          },
        });
      } else {
        entry = await tx.timelineEntry.create({
          data: {
            projectId: id,
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
              manualTrigger: true,
            },
          },
        });
      }
    });

    if (!entry) {
      return NextResponse.json(
        { message: failureMessage ?? "No notable changes to log." },
        { status: 400 },
      );
    }

    let updatedHealth: number | undefined;
    try {
      const healthResult = await healthService.recalculateOne(id);
      updatedHealth = healthResult?.health;
    } catch (err) {
      logger.warn(
        `[AI Pulse] Health recalculate after manual pulse failed for project ${id}`,
        { error: err },
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI Pulse successfully fetched and logged.",
      entry,
      ...(updatedHealth !== undefined ? { health: updatedHealth } : {}),
    });
  } catch (error) {
    logger.error("Failed to trigger AI pulse", { error });
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
