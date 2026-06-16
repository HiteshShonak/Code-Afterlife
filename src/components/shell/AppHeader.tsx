import { auth } from '@/lib/auth';
import { AppHeaderClient } from './AppHeaderClient';

// app shell header server component
export async function AppHeader() {
  const session = await auth();

  // fallback check
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
