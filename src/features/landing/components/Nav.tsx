import { NavClient } from './NavClient';

// server nav
export async function Nav() {
  let user: {
    id?: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  } | null = null;

  try {
    // dynamic import auth
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    user = session?.user ?? null;
  } catch {
    // fallback to null user
    user = null;
  }

  return <NavClient user={user} />;
}
