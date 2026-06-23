import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ghFetch, calcHealthFromCommits, generatePulse } from '@/lib/ai-pulse';

export const maxDuration = 60; // Vercel serverless limit

// ─── Main cron handler ────────────────────────────────────────────────────────
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

    // 2. Fetch all candidate projects
    //    that have a GitHub URL and haven't been checked within 6 hours.
    const candidates = await prisma.project.findMany({
      where: {
        state: { in: ['BORN', 'ACTIVE', 'STALLED', 'DEAD', 'SHIPPED'] },
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
        lastActivityAt: true,
        lastPulseCheckAt: true,
      },
    });

    if (!candidates.length) {
      return NextResponse.json({ message: 'No projects due for a pulse check.' });
    }

    // 3. Probabilistic stagger: 
    //    - Never checked or >12h ago  → always process (100%)
    //    - 6–12h ago                  → 20% random chance
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

        // --- Fetch commits since last activity (or 14 days for dead projects) ---
        const lookbackDays = project.state === 'DEAD' ? 14 : 7;
        const sinceDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
        const commitsRes = await ghFetch(
          `/repos/${owner}/${repo}/commits?since=${sinceDate.toISOString()}&per_page=20`
        );

        // Mark as checked regardless of whether we find commits
        const pulseUpdate = { lastPulseCheckAt: now };

        if (!commitsRes.ok) {
          await prisma.project.update({ where: { id: project.id }, data: pulseUpdate });
          continue;
        }

        const commits: any[] = await commitsRes.json();

        // --- Always update lastPulseCheckAt ---
        if (commits.length === 0) {
          await prisma.project.update({ where: { id: project.id }, data: pulseUpdate });
          results.push({ id: project.id, action: 'no_commits' });
          continue;
        }

        // --- Fetch README for richer context ---
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

        const commitMessages = commits.map((c: any) => c.commit?.message ?? '');
        const isResurrection =
          project.state === 'DEAD' || project.state === 'STALLED';

        // --- Generate AI summary ---
        const summary = await generatePulse(
          project.title,
          commitMessages,
          readme,
          isResurrection
        );

        // --- Calculate new health score ---
        const newHealth = calcHealthFromCommits(commits.length, project.health);

        // --- Build DB updates ---
        const projectDataUpdate: Record<string, unknown> = {
          ...pulseUpdate,
          lastActivityAt: now,
          health: newHealth,
        };

        if (isResurrection) {
          // Auto-resurrect the project
          projectDataUpdate.state = 'ACTIVE';
        }

        await prisma.project.update({
          where: { id: project.id },
          data: projectDataUpdate,
        });

        // --- Create timeline entries ---
        if (isResurrection) {
          await prisma.timelineEntry.create({
            data: {
              projectId: project.id,
              type: 'RESURRECTION',
              title: 'Resurrected by Original Author',
              description:
                summary ??
                `The original author returned and pushed ${commits.length} new commit${commits.length > 1 ? 's' : ''}. The project lives again.`,
              data: { commitCount: commits.length, repo: `${owner}/${repo}` },
            },
          });
        } else if (summary) {
          // Regular AI pulse for active projects
          await prisma.timelineEntry.create({
            data: {
              projectId: project.id,
              type: 'AI_BUILD_LOG',
              title: 'AI Pulse Observation',
              description: summary,
              data: { commitCount: commits.length, repo: `${owner}/${repo}` },
            },
          });
        }

        results.push({
          id: project.id,
          action: isResurrection ? 'resurrected' : 'pulse_written',
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
