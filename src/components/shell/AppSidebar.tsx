import { auth } from '@/lib/auth';
import { AppSidebarClient } from './AppSidebarClient';

/**
 * Server component for the app sidebar.
 * Reads auth session and passes user data to client component.
 * Returns null if session is missing (layout already redirects).
 */
export async function AppSidebar() {
  const session = await auth();

  if (!session?.user?.id) return null;

  return (
    <AppSidebarClient
      user={{
        id:       session.user.id,
        name:     session.user.name ?? null,
        username: session.user.username ?? null,
        image:    session.user.image ?? null,
      }}
    />
  );
}
