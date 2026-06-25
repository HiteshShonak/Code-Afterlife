import { apiResponse } from '@/lib/api-response';
import { asyncHandler } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { getGitHubFailureDetails } from '@/lib/ai-pulse';
import { logger } from '@/lib/logger';

export interface GithubRepoItem {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
  isPrivate: boolean;
}

export const GET = asyncHandler(async () => {
  const user = await requireAuth();

  const account = await prisma.account.findFirst({
    where: { userId: user.id, provider: 'github' },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return apiResponse.error('no_token', 401);
  }

  const ghRes = await fetch(
    'https://api.github.com/user/repos?sort=updated&per_page=100&type=owner',
    {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!ghRes.ok) {
    let errorCode = 'github_error';
    try {
      const body = await ghRes.json();
      if (ghRes.status === 401 || ghRes.status === 403) {
        errorCode = 'reauth_needed';
      }
      logger.error('[github/repos] GitHub API error', {
        ...getGitHubFailureDetails(ghRes),
        body,
      });
    } catch (error) {
      logger.error('[github/repos] GitHub API error body parse failed', {
        ...getGitHubFailureDetails(ghRes),
        error,
      });
    }
    return apiResponse.error(errorCode, ghRes.status >= 500 ? 502 : 401);
  }

  const raw = await ghRes.json() as Array<Record<string, unknown>>;

  const repos: GithubRepoItem[] = raw.map((r) => ({
    id: Number(r.id),
    name: String(r.name ?? ''),
    full_name: String(r.full_name ?? ''),
    html_url: String(r.html_url ?? ''),
    description: typeof r.description === 'string' ? r.description : null,
    language: typeof r.language === 'string' ? r.language : null,
    stars: Number(r.stargazers_count ?? 0),
    updatedAt: String(r.updated_at ?? ''),
    isPrivate: Boolean(r.private),
  }));

  return apiResponse.success(repos);
});
