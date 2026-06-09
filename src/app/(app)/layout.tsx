import { AppSidebar } from '@/components/shell/AppSidebar';
import { GuestSidebar } from '@/components/shell/GuestSidebar';

export const dynamic = 'force-dynamic';


/**
 * Route group layout for the app shell.
 * Wraps /dashboard, /search, /project/[slug], /explore, /faq, /legacy, etc.
 *
 * Auth strategy:
 *   - Authenticated users: see full AppSidebar (with Dashboard + profile chip).
 *   - Unauthenticated users: see GuestSidebar (with Sign In prompt, no Dashboard).
 *   - Individual protected pages (e.g. /dashboard) do their own auth check + redirect.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let hasSession = false;
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    hasSession = !!session?.user?.id;
  } catch {
    hasSession = false;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar — authenticated users get full sidebar, guests get sign-in sidebar */}
      {hasSession ? <AppSidebar /> : <GuestSidebar />}

      {/* Main content — always padded on desktop since we always show a sidebar */}
      <main className="min-h-screen flex-1 lg:pl-72">
        {children}
      </main>
    </div>
  );
}
