import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
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
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!project.githubRepoUrl) {
      return NextResponse.json({ message: 'No GitHub URL attached to this project. Cannot run AI Fetch.' }, { status: 400 });
    }

    // Rate limit: 1 manual AI pulse per 12 hours
    const now = new Date();
    const halfDayAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    
    // Check if a manual AI fetch was done in the last 12h
    const recentAILog = await prisma.timelineEntry.findFirst({
      where: {
        projectId: id,
        type: { in: ['AI_BUILD_LOG', 'RESURRECTION'] },
        createdAt: { gte: halfDayAgo },

      }
    });

    if (recentAILog) {
      return NextResponse.json(
        { message: 'An AI Pulse has already run recently. Please wait 12 hours to manually force it again.' },
        { status: 429 }
      );
    }

    const match = project.githubRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json({ message: 'Invalid GitHub URL format.' }, { status: 400 });
    }

    const [, owner, repoRaw] = match;
    const repo = repoRaw.replace(/\.git$/, '');

    // Fetch only from the active freshness window
    const sinceDate = getPulseSinceDate(project, now);
    const untilDate = getPulseUntilDate(now);
    const commitsRes = await ghFetch(
      `/repos/${owner}/${repo}/commits?since=${sinceDate.toISOString()}&until=${untilDate.toISOString()}&per_page=20`
    );

    if (!commitsRes.ok) {
      return NextResponse.json({ message: 'Failed to fetch commits from GitHub.' }, { status: 502 });
    }

    const commits: GitHubCommit[] = await commitsRes.json();
    const freshCommits = getFreshCommitsForPulse(commits, project, now);

    if (freshCommits.length === 0) {
      // Update check time but no new entry
      await prisma.project.update({ where: { id }, data: { lastPulseCheckAt: now } });
      return NextResponse.json(
        {
          message:
            commits.length === 0
              ? 'No new commits found since the last check.'
              : 'Only stale commits were found. Lifecycle activity requires commits from the last 24 hours.',
        },
        { status: 400 }
      ); // Return 400 to show message in UI
    }

    // Fetch README
    let readme: string | null = null;
    try {
      const readmeRes = await ghFetch(`/repos/${owner}/${repo}/readme`);
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      }
    } catch {
      // ignore
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
        where: { id },
        data: { lastPulseCheckAt: now },
      });

      return NextResponse.json(
        {
          message:
            'Recent commits were found, but none were authored by the project owner, so the lifecycle state was left unchanged.',
        },
        { status: 400 }
      );
    }

    const activityCommits = shouldActivate ? ownerCommits : freshCommits;
    const latestActivityAt = getLatestCommitDate(activityCommits);
    if (!latestActivityAt) {
      await prisma.project.update({ where: { id }, data: { lastPulseCheckAt: now } });
      return NextResponse.json(
        { message: 'Fresh commits were found, but none had usable timestamps.' },
        { status: 400 }
      );
    }

    const commitMessages = activityCommits.map((commit) => commit.commit?.message ?? '');
    const summary = await generatePulse(
      project.title,
      commitMessages,
      readme,
      isDeadResurrection
    );
    const newHealth = calcHealthFromCommits(activityCommits.length, project.health);

    let entry = null;
    await prisma.$transaction(async (tx) => {
      if (shouldActivate) {
        await projectService.updateState(id, 'ACTIVE', {
          source: 'ai_pulse',
          tx,
        });
      }

      await tx.project.update({
        where: { id },
        data: {
          lastPulseCheckAt: now,
          lastActivityAt: latestActivityAt,
          health: newHealth,
        },
      });

      if (isDeadResurrection) {
        entry = await tx.timelineEntry.create({
          data: {
            projectId: id,
            type: 'RESURRECTION',
            title: 'Resurrected by Original Author',
            description:
              summary ??
              `The original author returned and pushed ${ownerCommits.length} new commit(s).`,
            data: {
              commitCount: ownerCommits.length,
              repo: `${owner}/${repo}`,
              latestCommitAt: latestActivityAt.toISOString(),
              manualTrigger: true,
            },
          },
        });
      } else if (summary || shouldActivate) {
        entry = await tx.timelineEntry.create({
          data: {
            projectId: id,
            type: 'AI_BUILD_LOG',
            title: shouldActivate ? 'AI Pulse Activation' : 'AI Pulse Observation',
            description:
              summary ??
              `The original author pushed ${ownerCommits.length} new commit(s), and the project woke back up.`,
            data: {
              commitCount: activityCommits.length,
              ownerCommitCount: ownerCommits.length,
              repo: `${owner}/${repo}`,
              latestCommitAt: latestActivityAt.toISOString(),
              manualTrigger: true,
            },
          },
        });
      }
    });

    if (!entry) {
      return NextResponse.json({ message: 'No notable changes to log.' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'AI Pulse successfully fetched and logged.',
      entry 
    });

  } catch (error) {
    console.error('Failed to trigger AI pulse:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
