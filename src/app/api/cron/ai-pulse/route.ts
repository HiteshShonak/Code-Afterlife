import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ghFetch,
  calcHealthFromCommits,
  generatePulse,
  getFreshCommitsForPulse,
  getLatestCommitDate,
  getPulseSinceDate,
  getPulseUntilDate,
  isOwnerAuthoredCommit,
  type GitHubCommit,
} from '@/lib/ai-pulse';
import { projectService } from '@/services/project.service';

export const maxDuration = 60; // Vercel serverless limit

// main cron handler
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    // 2. Fetch all candidate projects with a GitHub URL not checked within 6 hours
    const candidates = await prisma.project.findMany({
      where: {
        state: { in: ['BORN', 'ACTIVE', 'STALLED', 'DEAD'] },
        githubRepoUrl: { not: '' },
        OR: [
          { lastPulseCheckAt: null },
          { lastPulseCheckAt: { lt: sixHoursAgo } },
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
      return NextResponse.json({ message: 'No projects due for a pulse check.' });
    }

    // 3. Probabilistic stagger (20% chance if 6-12h ago, 100% if >12h ago)
    const projectsToProcess = candidates.filter((p) => {
      if (!p.lastPulseCheckAt || p.lastPulseCheckAt < twelveHoursAgo) return true;
      return Math.random() < 0.20; // 20% chance in the 6–12h window
    });

    if (!projectsToProcess.length) {
      return NextResponse.json({ message: 'No projects selected this run (stagger).' });
    }

    const results: { id: string; action: string }[] = [];

    // 4. Process each selected project
    for (const project of projectsToProcess) {
      try {
        const match = project.githubRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) continue;
        const [, owner, repoRaw] = match;
        // Strip .git suffix if present
        const repo = repoRaw.replace(/\.git$/, '');

        // Fetch only from the active freshness window, with a tiny overlap for API lag.
        const sinceDate = getPulseSinceDate(project, now);
        const untilDate = getPulseUntilDate(now);
        const commitsRes = await ghFetch(
          `/repos/${owner}/${repo}/commits?since=${sinceDate.toISOString()}&until=${untilDate.toISOString()}&per_page=20`
        );

        // Mark as checked regardless of whether we find commits
        const pulseUpdate = { lastPulseCheckAt: now };

        if (!commitsRes.ok) {
          await prisma.project.update({ where: { id: project.id }, data: pulseUpdate });
          continue;
        }

        const commits: GitHubCommit[] = await commitsRes.json();
        const freshCommits = getFreshCommitsForPulse(commits, project, now);

        // Older commits should not refresh lifecycle activity or create timeline noise.
        if (freshCommits.length === 0) {
          await prisma.project.update({ where: { id: project.id }, data: pulseUpdate });
          results.push({ id: project.id, action: commits.length === 0 ? 'no_commits' : 'stale_commits_ignored' });
          continue;
        }

        // fetch README for richer context
        let readme: string | null = null;
        try {
          const readmeRes = await ghFetch(`/repos/${owner}/${repo}/readme`);
          if (readmeRes.ok) {
            const readmeData = await readmeRes.json();
            // GitHub returns base64-encoded content
            readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
          }
        } catch {
          // README is optional context - continue without it
        }

        const ownerCommits = freshCommits.filter((commit) =>
          isOwnerAuthoredCommit(commit, project.user)
        );
        const isDeadResurrection = project.state === 'DEAD';
        const isRevival = project.state === 'STALLED' || isDeadResurrection;
        const isFirstActivity = project.state === 'BORN';
        const shouldActivate = isFirstActivity || isRevival;

        if (shouldActivate && ownerCommits.length === 0) {
          await prisma.project.update({
            where: { id: project.id },
            data: pulseUpdate,
          });
          results.push({ id: project.id, action: 'no_owner_commits' });
          continue;
        }

        const activityCommits = shouldActivate ? ownerCommits : freshCommits;
        const latestActivityAt = getLatestCommitDate(activityCommits);
        if (!latestActivityAt) {
          await prisma.project.update({ where: { id: project.id }, data: pulseUpdate });
          results.push({ id: project.id, action: 'commits_missing_dates' });
          continue;
        }

        const commitMessages = activityCommits.map((commit) => commit.commit?.message ?? '');

        // generate AI summary
        const summary = await generatePulse(
          project.title,
          commitMessages,
          readme,
          isDeadResurrection
        );

        // calculate new health score
        const newHealth = calcHealthFromCommits(activityCommits.length, project.health);

        await prisma.$transaction(async (tx) => {
          if (shouldActivate) {
            await projectService.updateState(project.id, 'ACTIVE', {
              source: 'ai_pulse',
              tx,
            });
          }

          await tx.project.update({
            where: { id: project.id },
            data: {
              ...pulseUpdate,
              lastActivityAt: latestActivityAt,
              health: newHealth,
            },
          });

          if (isDeadResurrection) {
            await tx.timelineEntry.create({
              data: {
                projectId: project.id,
                type: 'RESURRECTION',
                title: 'Resurrected by Original Author',
                description:
                  summary ??
                  `The original author returned and pushed ${ownerCommits.length} new commit${ownerCommits.length > 1 ? 's' : ''}. The project lives again.`,
                data: {
                  commitCount: ownerCommits.length,
                  repo: `${owner}/${repo}`,
                  latestCommitAt: latestActivityAt.toISOString(),
                },
              },
            });
          } else if (summary || shouldActivate) {
            await tx.timelineEntry.create({
              data: {
                projectId: project.id,
                type: 'AI_BUILD_LOG',
                title: shouldActivate ? 'AI Pulse Activation' : 'AI Pulse Observation',
                description:
                  summary ??
                  `The original author pushed ${ownerCommits.length} new commit${ownerCommits.length > 1 ? 's' : ''}, and the project woke back up.`,
                data: {
                  commitCount: activityCommits.length,
                  ownerCommitCount: ownerCommits.length,
                  repo: `${owner}/${repo}`,
                  latestCommitAt: latestActivityAt.toISOString(),
                },
              },
            });
          }
        });

        results.push({
          id: project.id,
          action: isDeadResurrection ? 'resurrected' : shouldActivate ? 'activated' : 'pulse_written',
        });
      } catch (err) {
        console.error(`[AI Pulse] Failed project ${project.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      checked: projectsToProcess.length,
      results,
    });
  } catch (error) {
    console.error('[AI Pulse] Cron Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
