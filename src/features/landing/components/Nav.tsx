import { NavClient } from './NavClient';

/**
 * Server component Nav — reads auth session and passes user to NavClient.
 *
 * IMPORTANT: auth() is wrapped in try/catch because it requires a DB connection.
 * If the DB is not yet configured, the landing page must still render
 * (gracefully degraded — shows Sign In button instead of crashing).
 *
 * This follows the "public-first" design: the landing page is accessible
 * to all users (guests and authenticated).
 */
export async function Nav() {
  let user: {
    id?: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  } | null = null;

  try {
    // Dynamic import so auth module only loads when called (avoids module-level crash)
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    user = session?.user ?? null;
  } catch {
    // DB not connected, auth misconfigured, or env vars missing.
    // Landing page still renders — user sees Sign In button.
    user = null;
  }

  return <NavClient user={user} />;
}
