import { auth } from '@/lib/auth';
import { ApiError } from '@/lib/api-error';
import type { AuthUser } from '@/types/auth';

/**
 * Get the current authenticated user, or null if not signed in.
 * Safe to call in any context — never throws.
 */
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

/**
 * Require authenticated user. Throws ApiError.unauthorized() if not signed in.
 * Used at the top of route handlers and server actions that need auth.
 *
 * @throws {ApiError} 401 if no valid session
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw ApiError.unauthorized('You must be signed in');
  }

  return user;
}
