import { AppSidebar } from '@/components/shell/AppSidebar';

/**
 * Route group layout for the app shell.
 * Wraps /dashboard, /search, /project/[slug], /faq.
 *
 * Auth strategy:
 *   - Layout is session-optional: renders sidebar only when session exists.
 *   - Individual protected pages (e.g. /dashboard) do their own auth check + redirect.
 *   - Public pages (explore, project detail, faq) render normally for unauthenticated users.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Attempt to get session â€” if none, sidebar simply won't render.
  // Protected child pages call auth() themselves and redirect if needed.
  let hasSession = false;
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    hasSession = !!session?.user?.id;
  } catch {
    // Auth error: treat as unauthenticated â€” public pages still render
    hasSession = false;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Floating sidebar â€” only rendered when authenticated */}
      {hasSession && <AppSidebar />}

      {/* Main content â€” padded left to avoid sidebar overlap on desktop (when sidebar is present) */}
      <main className={['min-h-screen flex-1', hasSession ? 'lg:pl-72' : ''].join(' ')}>
        {children}
      </main>
    </div>
  );
}
