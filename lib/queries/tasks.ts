import { createClient } from '@/lib/supabase/server';
import {
  Task, TaskWithDetails, Subtask, CommentWithUser, Label,
  TaskDependencyWithTask, ProjectMemberInfo,
} from '@/lib/types/tasks';
import { Project } from '@/lib/types/database';

interface TaskRow extends Task {
  assignee: { full_name: string | null; email: string | null } | null;
  creator: { full_name: string | null } | null;
}

interface CommentRow {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: { full_name: string | null; email: string | null } | null;
}

interface SubtaskRow extends Task {
  assignee: { full_name: string | null } | null;
}

interface DependencyRow {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
  depends_on: { title: string; status: string } | null;
}

export async function getProjectTasks(projectId: string): Promise<TaskWithDetails[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(full_name, email),
      creator:profiles!tasks_created_by_fkey(full_name)
    `)
    .eq('project_id', projectId)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const tasks = data as unknown as TaskRow[];

  const result: TaskWithDetails[] = [];

  for (const task of tasks) {
    const { count: subtaskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('parent_task_id', task.id);

    const { count: subtaskDone } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('parent_task_id', task.id)
      .eq('status', 'done');

    const { data: labelData } = await supabase
      .from('task_labels')
      .select(`
        label:labels(id, name, color)
      `)
      .eq('task_id', task.id);

    const labels = (labelData as unknown as Array<{ label: { id: string; name: string; color: string } | null }>)
      .map((item) => item.label)
      .filter((l): l is { id: string; name: string; color: string } => l !== null);

    result.push({
      ...task,
      assignee_name: task.assignee?.full_name ?? null,
      assignee_email: task.assignee?.email ?? null,
      creator_name: task.creator?.full_name ?? null,
      subtask_count: subtaskCount ?? 0,
      subtask_done_count: subtaskDone ?? 0,
      labels,
    });
  }

  return result;
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Task;
}

export async function getTaskSubtasks(parentTaskId: string): Promise<Subtask[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(full_name)
    `)
    .eq('parent_task_id', parentTaskId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as unknown as SubtaskRow[]).map((s) => ({
    ...s,
    assignee_name: s.assignee?.full_name ?? null,
  }));
}

export async function getTaskComments(taskId: string): Promise<CommentWithUser[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles!comments_user_id_fkey(full_name, email)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as unknown as CommentRow[]).map((c) => ({
    id: c.id,
    task_id: c.task_id,
    user_id: c.user_id,
    content: c.content,
    created_at: c.created_at,
    updated_at: c.updated_at,
    author_name: c.author?.full_name ?? null,
    author_email: c.author?.email ?? null,
  }));
}

export async function getWorkspaceLabels(workspaceId: string): Promise<Label[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data as unknown as Label[];
}

export async function getTaskLabels(taskId: string): Promise<{ id: string; name: string; color: string }[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('task_labels')
    .select(`
      label:labels(id, name, color)
    `)
    .eq('task_id', taskId);

  if (error || !data) return [];

  return (data as unknown as Array<{ label: { id: string; name: string; color: string } | null }>)
    .map((item) => item.label)
    .filter((l): l is { id: string; name: string; color: string } => l !== null);
}

export async function getTaskDependencies(taskId: string): Promise<TaskDependencyWithTask[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('task_dependencies')
    .select(`
      *,
      depends_on:tasks!task_dependencies_depends_on_task_id_fkey(title, status)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as unknown as DependencyRow[]).map((d) => ({
    id: d.id,
    task_id: d.task_id,
    depends_on_task_id: d.depends_on_task_id,
    created_at: d.created_at,
    depends_on_title: d.depends_on?.title ?? 'Unknown',
    depends_on_status: (d.depends_on?.status as 'todo' | 'in_progress' | 'done') ?? 'todo',
  }));
}

export async function getProjectMembers(projectId: string): Promise<ProjectMemberInfo[]> {
  const supabase = createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('workspace_id')
    .eq('id', projectId)
    .maybeSingle();

  if (!project) return [];

  const workspaceId = (project as unknown as { workspace_id: string }).workspace_id;

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      id, user_id, role,
      profile:profiles!workspace_members_user_id_fkey(full_name, email)
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as unknown as Array<{
    id: string;
    user_id: string;
    role: string;
    profile: { full_name: string | null; email: string | null } | null;
  }>).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    full_name: m.profile?.full_name ?? null,
    email: m.profile?.email ?? null,
  }));
}

export async function getProjectTaskStats(projectId: string): Promise<{
  total: number;
  completed: number;
  remaining: number;
}> {
  const supabase = createClient();

  const { count: total } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('parent_task_id', null);

  const { count: completed } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('parent_task_id', null)
    .eq('status', 'done');

  const t = total ?? 0;
  const c = completed ?? 0;

  return { total: t, completed: c, remaining: t - c };
}

export async function getProjectForTask(projectId: string): Promise<Project | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Project;
}
