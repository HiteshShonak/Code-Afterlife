import { HEALTH_CONFIG } from "@/config/health";
import { logger } from "@/lib/logger";
import type { ProjectState } from "@prisma/client";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COMMIT_FETCH_OVERLAP_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

export const ghFetch = (path: string) =>
  fetch(`https://api.github.com${path}`, {
    headers: {
      "User-Agent": "Code-Afterlife-AI-Cron",
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    },
    next: { revalidate: 0 },
  });

export function getGitHubFailureDetails(
  response: Response,
): Record<string, string | null> {
  return {
    status: String(response.status),
    statusText: response.statusText,
    rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
    rateLimitReset: response.headers.get("x-ratelimit-reset"),
    retryAfter: response.headers.get("retry-after"),
  };
}

export function isGitHubRateLimitExceeded(response: Response): boolean {
  const remaining = response.headers.get("x-ratelimit-remaining");
  return response.status === 429 || remaining === "0";
}

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

export interface PulseLifecycleContext {
  readonly isDeadResurrection: boolean;
  readonly shouldActivate: boolean;
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
    now.getTime() - HEALTH_CONFIG.deadDays * MS_PER_DAY,
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

export function getPulseUntilDate(now = new Date()): Date {
  return new Date(now.getTime() + CLOCK_SKEW_MS);
}

export function getFreshCommitsForPulse(
  commits: readonly GitHubCommit[],
  project: PulseProjectActivity,
  now = new Date(),
): GitHubCommit[] {
  const baseline = project.lastActivityAt ?? project.createdAt;
  const freshnessCutoff = new Date(
    now.getTime() - HEALTH_CONFIG.deadDays * MS_PER_DAY,
  );
  const futureCutoff = new Date(now.getTime() + CLOCK_SKEW_MS);

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

export function getLatestCommitDate(
  commits: readonly GitHubCommit[],
): Date | null {
  const dates = commits
    .map((commit) => getCommitDate(commit))
    .filter((date): date is Date => Boolean(date));

  if (!dates.length) return null;

  return maxDate(dates);
}

export function getPulseLifecycleContext(
  state: ProjectState,
): PulseLifecycleContext {
  const isDeadResurrection = state === "DEAD";
  const isRevival = state === "STALLED" || isDeadResurrection;
  const isFirstActivity = state === "BORN";

  return {
    isDeadResurrection,
    shouldActivate: isFirstActivity || isRevival,
  };
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

export function sanitizeFutureDate(
  date: Date | null | undefined,
  now = new Date(),
): Date | null {
  if (!date) return null;
  return date > now ? null : date;
}

export function calcHealthFromCommits(
  commitCount: number,
  currentHealth: number,
  currentState?: string,
): number {
  const bump = Math.min(15, commitCount * 3);
  const raw = Math.round(Math.min(100, currentHealth + bump));

  if (currentState === "SHIPPED") return Math.max(90.1, Math.min(raw, 99.9));
  if (currentState === "DEAD") return Math.min(raw, 45);
  if (currentState === "STALLED")
    return Math.min(raw, HEALTH_CONFIG.thresholds.stable);

  return Math.min(raw, 95);
}

export async function generatePulse(
  projectTitle: string,
  commitMessages: string[],
  readme: string | null,
  isResurrection: boolean,
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const context = [
    `Project: "${projectTitle}"`,
    readme ? `\nREADME excerpt:\n${readme.slice(0, 800)}` : "",
    `\nRecent commits:\n- ${commitMessages.slice(0, 12).join("\n- ")}`,
  ].join("");

  const systemPrompt = isResurrection
    ? `You are a cinematic narrator for Code Afterlife - a platform where dead software projects come back to life.
A project that was DEAD has just received new commits from its original author. Write a short, emotionally charged summary marking its resurrection.
Make sure to properly give updates about what happened in those commits.
Tone: Atmospheric, hopeful, poetic. Like a ghost stirring back to life. Do NOT use corporate speak or bullet points.
Length: Between 20 to 40 words.
Example: "Against all odds, the creator returned. The terminal hummed to life again, a quiet promise that the work was not yet finished. New dependencies were installed, clearing away the dust of years passed."`
    : `You are a cinematic observer charting the progress of a software project on Code Afterlife.
Read the commits and README excerpt, then write a short summary of what the developer accomplished.
Make sure to properly give updates about what happened in those commits.
Tone: Atmospheric, observant, slightly poetic - like a narrator watching a creator at work. Do NOT sound like a robot.
Length: Between 20 to 40 words.
Example: "The creator pushed deep into the night, stabilizing the core engine and sealing a long-standing memory leak. As the final tests passed, a new era for the architecture began."`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context },
        ],
        max_tokens: 80,
        temperature: 0.82,
      }),
    });
    if (!res.ok) {
      logger.error("Groq pulse generation failed", {
        status: res.status,
        statusText: res.statusText,
      });
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    logger.error("Groq pulse generation threw", { error });
    return null;
  }
}
