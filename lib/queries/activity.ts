import { createClient } from '@/lib/supabase/server';
import { ActivityEventWithUser } from '@/lib/types/tasks';

interface ActivityRow {
  id: string;
  workspace_id: string;
  project_id: string | null;
  task_id: string | null;
  user_id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user: { full_name: string | null; email: string | null } | null;
}

export async function getProjectActivity(projectId: string, limit = 30): Promise<ActivityEventWithUser[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_events')
    .select(`
      *,
      user:profiles!activity_events_user_id_fkey(full_name, email)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  const rows = data as unknown as ActivityRow[];
  return rows.map((r) => ({
    id: r.id,
    workspace_id: r.workspace_id,
    project_id: r.project_id,
    task_id: r.task_id,
    user_id: r.user_id,
    event_type: r.event_type,
    metadata: r.metadata,
    created_at: r.created_at,
    user_name: r.user?.full_name ?? null,
    user_email: r.user?.email ?? null,
  }));
}

export async function getTaskActivity(taskId: string, limit = 20): Promise<ActivityEventWithUser[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_events')
    .select(`
      *,
      user:profiles!activity_events_user_id_fkey(full_name, email)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  const rows = data as unknown as ActivityRow[];
  return rows.map((r) => ({
    id: r.id,
    workspace_id: r.workspace_id,
    project_id: r.project_id,
    task_id: r.task_id,
    user_id: r.user_id,
    event_type: r.event_type,
    metadata: r.metadata,
    created_at: r.created_at,
    user_name: r.user?.full_name ?? null,
    user_email: r.user?.email ?? null,
  }));
}
