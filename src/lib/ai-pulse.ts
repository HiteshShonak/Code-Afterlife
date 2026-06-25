import { HEALTH_CONFIG } from '@/config/health';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COMMIT_FETCH_OVERLAP_MS = 5 * 60 * 1000;
const CLOCK_SKEW_ALLOWANCE_MS = 5 * 60 * 1000;

export const ghFetch = (path: string) =>
  fetch(`https://api.github.com${path}`, {
    headers: {
      'User-Agent': 'Code-Afterlife-AI-Cron',
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    },
    next: { revalidate: 0 },
  });

export interface GitHubCommit {
  author?: {
    id?: number | null;
    login?: string | null;
  } | null;
  commit?: {
    message?: string | null;
    author?: {
      date?: string | null;
    } | null;
    committer?: {
      date?: string | null;
    } | null;
  };
}

export interface ProjectOwnerIdentity {
  githubId?: number | null;
  username?: string | null;
}

export interface PulseProjectActivity {
  readonly createdAt: Date;
  readonly lastActivityAt?: Date | null;
  readonly lastPulseCheckAt?: Date | null;
}

function maxDate(dates: readonly Date[]): Date {
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

export function getCommitDate(commit: GitHubCommit): Date | null {
  const rawDate = commit.commit?.committer?.date ?? commit.commit?.author?.date;
  if (!rawDate) return null;

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export function getPulseSinceDate(
  project: PulseProjectActivity,
  now = new Date(),
): Date {
  const freshnessCutoff = new Date(
    now.getTime() - HEALTH_CONFIG.stalledDays * MS_PER_DAY,
  );
  const lastPulseOverlap = project.lastPulseCheckAt
    ? new Date(project.lastPulseCheckAt.getTime() - COMMIT_FETCH_OVERLAP_MS)
    : null;

  return maxDate([
    freshnessCutoff,
    project.createdAt,
    ...(lastPulseOverlap ? [lastPulseOverlap] : []),
  ]);
}

export function getFreshCommitsForPulse(
  commits: readonly GitHubCommit[],
  project: PulseProjectActivity,
  now = new Date(),
): GitHubCommit[] {
  const baseline = project.lastActivityAt ?? project.createdAt;
  const freshnessCutoff = new Date(
    now.getTime() - HEALTH_CONFIG.stalledDays * MS_PER_DAY,
  );
  const futureCutoff = new Date(now.getTime() + CLOCK_SKEW_ALLOWANCE_MS);

  return commits
    .filter((commit) => {
      const commitDate = getCommitDate(commit);
      if (!commitDate) return false;

      return (
        commitDate > baseline &&
        commitDate >= freshnessCutoff &&
        commitDate <= futureCutoff
      );
    })
    .sort((a, b) => {
      const aDate = getCommitDate(a)?.getTime() ?? 0;
      const bDate = getCommitDate(b)?.getTime() ?? 0;
      return bDate - aDate;
    });
}

export function getLatestCommitDate(commits: readonly GitHubCommit[]): Date | null {
  const dates = commits
    .map((commit) => getCommitDate(commit))
    .filter((date): date is Date => Boolean(date));

  if (!dates.length) return null;

  return maxDate(dates);
}

export function isOwnerAuthoredCommit(
  commit: GitHubCommit,
  owner: ProjectOwnerIdentity,
): boolean {
  if (owner.githubId && commit.author?.id === owner.githubId) {
    return true;
  }

  if (owner.username && commit.author?.login) {
    return commit.author.login.toLowerCase() === owner.username.toLowerCase();
  }

  return false;
}

export function calcHealthFromCommits(commitCount: number, currentHealth: number): number {
  const commitScore = Math.min(100, (commitCount / 10) * 100);
  return Math.round(commitScore * 0.6 + currentHealth * 0.4);
}

export async function generatePulse(
  projectTitle: string,
  commitMessages: string[],
  readme: string | null,
  isResurrection: boolean
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const context = [
    `Project: "${projectTitle}"`,
    readme ? `\nREADME excerpt:\n${readme.slice(0, 800)}` : '',
    `\nRecent commits:\n- ${commitMessages.slice(0, 12).join('\n- ')}`,
  ].join('');

  const systemPrompt = isResurrection
    ? `You are a cinematic narrator for Code Afterlife - a platform where dead software projects come back to life.
A project that was DEAD has just received new commits from its original author. Write a short, emotionally charged summary marking its resurrection.
Tone: Atmospheric, hopeful, poetic. Like a ghost stirring back to life. Do NOT use corporate speak or bullet points.
CRITICAL LIMIT: Keep it extremely concise. Maximum 30 words. Do not exceed this limit.
Example: "Against all odds, the creator returned. The terminal hummed to life again - a quiet promise that the work was not yet finished."`
    : `You are a cinematic observer charting the progress of a software project on Code Afterlife.
Read the commits and README excerpt, then write a short summary of what the developer accomplished.
Tone: Atmospheric, observant, slightly poetic - like a narrator watching a creator at work. Do NOT sound like a robot.
CRITICAL LIMIT: Keep it extremely concise. Maximum 30 words. Do not exceed this limit.
Example: "The creator pushed deep into the night, stabilizing the core engine and sealing a long-standing memory leak."`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context },
        ],
        max_tokens: 60,
        temperature: 0.82,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
