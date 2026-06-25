import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { asyncHandler } from '@/lib/async-handler';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

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

// get user repos
export const GET = asyncHandler(async (_request: NextRequest) => {
  const user = await requireAuth();

  // get github access token
  const account = await prisma.account.findFirst({
    where: { userId: user.id, provider: 'github' },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return apiResponse.error('no_token', 401);
  }

  // fetch owner repos
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
      // handle auth errors
      if (ghRes.status === 401 || ghRes.status === 403) {
        errorCode = 'reauth_needed';
      }
      console.error('[github/repos] GitHub API error:', ghRes.status, body);
    } catch {
      // ignore JSON parse error
    }
    return apiResponse.error(errorCode, ghRes.status >= 500 ? 502 : 401);
  }

  const raw: any[] = await ghRes.json();

  const repos: GithubRepoItem[] = raw.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description ?? null,
    language: r.language ?? null,
    stars: r.stargazers_count ?? 0,
    updatedAt: r.updated_at,
    isPrivate: r.private ?? false,
  }));

  return apiResponse.success(repos);
});
