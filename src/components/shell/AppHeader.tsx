import { auth } from '@/lib/auth';
import { AppHeaderClient } from './AppHeaderClient';

/**
 * Server component for the app shell header.
 * Reads the auth session and passes user data to the client component.
 */
export async function AppHeader() {
  const session = await auth();

  // The (app) layout guarantees auth, but we fallback safely just in case
  if (!session?.user?.id) {
    return null;
  }

  return (
    <AppHeaderClient
      user={{
        id:       session.user.id,
        name:     session.user.name ?? null,
        username: session.user.username ?? null,
        image:    session.user.image ?? null,
      }}
    />
  );
}
