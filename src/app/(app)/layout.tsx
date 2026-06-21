import { AppSidebar } from '@/components/shell/AppSidebar';
import { GuestSidebar } from '@/components/shell/GuestSidebar';

export const dynamic = 'force-dynamic';


// app shell layout
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
      {/* sidebar */}
      {hasSession ? <AppSidebar /> : <GuestSidebar />}

      {/* main content */}
      <main className="min-h-screen flex-1 min-w-0 w-full lg:pl-72">
        {children}
      </main>
    </div>
  );
}
