import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ghFetch, calcHealthFromCommits, generatePulse } from '@/lib/ai-pulse';

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
        lastPulseCheckAt: true
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

    // Rate limit: 1 manual AI pulse per 24 hours
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Check if a manual AI fetch was done in the last 24h
    // (We distinguish manual vs cron by checking a flag in JSON `data`, or just limit the route itself)
    // Actually, limiting any AI_BUILD_LOG in the last 24h is safest and prevents spamming LLM API.
    const recentAILog = await prisma.timelineEntry.findFirst({
      where: {
        projectId: id,
        type: { in: ['AI_BUILD_LOG', 'RESURRECTION'] },
        createdAt: { gte: oneDayAgo },
        // We look for manualTrigger in JSON data, but to be generous we just throttle to 1 per 24h total
      }
    });

    if (recentAILog) {
      return NextResponse.json(
        { message: 'An AI Pulse has already run recently. Please wait 24 hours to manually force it again.' },
        { status: 429 }
      );
    }

    const match = project.githubRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return NextResponse.json({ message: 'Invalid GitHub URL format.' }, { status: 400 });
    }

    const [, owner, repoRaw] = match;
    const repo = repoRaw.replace(/\.git$/, '');

    // Fetch commits
    const lookbackDays = project.state === 'DEAD' ? 14 : 7;
    const sinceDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    const commitsRes = await ghFetch(
      `/repos/${owner}/${repo}/commits?since=${sinceDate.toISOString()}&per_page=20`
    );

    if (!commitsRes.ok) {
      return NextResponse.json({ message: 'Failed to fetch commits from GitHub.' }, { status: 502 });
    }

    const commits: any[] = await commitsRes.json();

    if (commits.length === 0) {
      // Update check time but no new entry
      await prisma.project.update({ where: { id }, data: { lastPulseCheckAt: now } });
      return NextResponse.json({ message: 'No new commits found since last check.' }, { status: 400 }); // Return 400 to show message in UI
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

    const commitMessages = commits.map((c: any) => c.commit?.message ?? '');
    const isResurrection = project.state === 'DEAD' || project.state === 'STALLED';

    const summary = await generatePulse(project.title, commitMessages, readme, isResurrection);

    const newHealth = calcHealthFromCommits(commits.length, project.health);

    const projectDataUpdate: any = {
      lastPulseCheckAt: now,
      lastActivityAt: now,
      health: newHealth,
    };

    if (isResurrection) {
      projectDataUpdate.state = 'ACTIVE';
    }

    let entry = null;
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: projectDataUpdate,
      });

      if (isResurrection) {
        entry = await tx.timelineEntry.create({
          data: {
            projectId: id,
            type: 'RESURRECTION',
            title: 'Resurrected by Original Author',
            description: summary ?? `The original author returned and pushed ${commits.length} new commit(s).`,
            data: { commitCount: commits.length, repo: `${owner}/${repo}`, manualTrigger: true },
          },
        });
      } else if (summary) {
        entry = await tx.timelineEntry.create({
          data: {
            projectId: id,
            type: 'AI_BUILD_LOG',
            title: 'AI Pulse Observation',
            description: summary,
            data: { commitCount: commits.length, repo: `${owner}/${repo}`, manualTrigger: true },
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
