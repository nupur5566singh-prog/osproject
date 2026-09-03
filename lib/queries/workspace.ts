import { createClient } from '@/lib/supabase/server';
import { Workspace, WorkspaceWithRole, Project, ProjectWithCreator } from '@/lib/types/database';

interface WorkspaceMemberRow {
  role: string;
  workspace: Workspace;
}

export async function getUserWorkspaces(userId: string): Promise<WorkspaceWithRole[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      role,
      workspace:workspaces!inner(
        id, name, slug, created_by, created_at, updated_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as unknown as WorkspaceMemberRow[]).map((item) => ({
    ...item.workspace,
    role: item.role as 'owner' | 'member',
  }));
}

export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Workspace;
}

export async function getWorkspaceProjects(workspaceId: string): Promise<ProjectWithCreator[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      creator:profiles!projects_created_by_fkey(full_name)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as unknown as Array<Project & { creator?: { full_name: string | null } }>).map((p) => ({
    ...p,
    creator_name: p.creator?.full_name ?? null,
  }));
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Project;
}

export async function getWorkspaceProjectCount(workspaceId: string): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  if (error) return 0;
  return count ?? 0;
}
