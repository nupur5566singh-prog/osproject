import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/app/sidebar';
import { getUserWorkspaces } from '@/lib/queries/workspace';
import type { WorkspaceWithRole } from '@/lib/types/database';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const workspaces: WorkspaceWithRole[] = await getUserWorkspaces(session.user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar workspaces={workspaces} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
