import { auth } from '@/lib/auth';
import { AppSidebarClient } from './AppSidebarClient';

// app sidebar server component
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
