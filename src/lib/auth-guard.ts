import { auth } from '@/lib/auth';
import { ApiError } from '@/lib/api-error';
import type { AuthUser } from '@/types/auth';

// get user safely
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    username: session.user.username ?? null,
    githubId: session.user.githubId ?? null,
  };
}

// requires auth or throws
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw ApiError.unauthorized('You must be signed in');
  }

  return user;
}
