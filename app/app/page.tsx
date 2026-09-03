import { redirect } from 'next/navigation';
import { getUserWorkspaces } from '@/lib/queries/workspace';
import { createClient } from '@/lib/supabase/server';

export default async function AppHomePage() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const workspaces = await getUserWorkspaces(session.user.id);

  if (workspaces.length === 0) {
    redirect('/app/workspaces/new');
  }

  redirect(`/app/workspaces/${workspaces[0].id}`);
}
