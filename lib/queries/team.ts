import { createClient } from '@/lib/supabase/server';
import { WorkspaceMember } from '@/lib/types/database';

interface TeamMemberRow {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
}

export interface TeamMember extends WorkspaceMember {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<TeamMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      id, workspace_id, user_id, role, created_at,
      profile:profiles!workspace_members_user_id_fkey(full_name, email, avatar_url)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  const rows = data as unknown as TeamMemberRow[];
  return rows.map((r) => ({
    id: r.id,
    workspace_id: workspaceId,
    user_id: r.user_id,
    role: r.role as 'owner' | 'member',
    created_at: r.created_at,
    full_name: r.profile?.full_name ?? null,
    email: r.profile?.email ?? null,
    avatar_url: r.profile?.avatar_url ?? null,
  }));
}

export async function getMemberTaskCounts(workspaceId: string): Promise<Record<string, number>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('assignee_id')
    .eq('workspace_id', workspaceId)
    .is('parent_task_id', null)
    .not('assignee_id', 'is', null);

  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as unknown as Array<{ assignee_id: string | null }>) {
    if (row.assignee_id) {
      counts[row.assignee_id] = (counts[row.assignee_id] ?? 0) + 1;
    }
  }
  return counts;
}
