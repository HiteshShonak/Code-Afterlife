import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bodySchema = z.object({
  parentRepoUrl: z.string().url(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { parentRepoUrl } = bodySchema.parse(body);

    // Extract owner and repo from github url
    // e.g. https://github.com/torvalds/linux
    const match = parentRepoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ success: false, message: 'Invalid GitHub URL format.' }, { status: 400 });
    }
    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');

    // Get the user's GitHub access token from the Account table
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'github',
      },
      select: {
        access_token: true,
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { success: false, message: 'No GitHub access token found. Please sign out and sign back in.' },
        { status: 403 }
      );
    }

    // Call GitHub API to fork
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/forks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CodeAfterlife-App',
      },
    });

    if (!ghRes.ok) {
      const errorData = await ghRes.json().catch(() => ({}));
      console.error('GitHub API Fork Error:', errorData);
      
      // Handle the case where they haven't granted the public_repo scope
      if (ghRes.status === 404 || ghRes.status === 403) {
        return NextResponse.json({
          success: false, 
          message: 'GitHub denied access. You may need to grant repository access by signing out and signing back in.',
          needsReauth: true
        }, { status: 403 });
      }

      return NextResponse.json({ success: false, message: 'Failed to fork repository on GitHub.' }, { status: 500 });
    }

    const data = await ghRes.json();
    return NextResponse.json({ success: true, url: data.html_url });
  } catch (error: any) {
    console.error('Fork API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
  }
}
