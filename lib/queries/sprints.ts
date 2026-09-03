import { createClient } from '@/lib/supabase/server';
import { Sprint, SprintWithStats } from '@/lib/types/tasks';

export async function getProjectSprints(projectId: string): Promise<SprintWithStats[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const sprints = data as unknown as Sprint[];

  const result: SprintWithStats[] = [];

  for (const sprint of sprints) {
    const { count: total } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('sprint_id', sprint.id)
      .is('parent_task_id', null);

    const { count: completed } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('sprint_id', sprint.id)
      .is('parent_task_id', null)
      .eq('status', 'done');

    const t = total ?? 0;
    const c = completed ?? 0;

    result.push({
      ...sprint,
      total_tasks: t,
      completed_tasks: c,
      remaining_tasks: t - c,
    });
  }

  return result;
}

export async function getSprintById(sprintId: string): Promise<Sprint | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('id', sprintId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Sprint;
}

export async function getActiveSprint(projectId: string): Promise<Sprint | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as Sprint;
}

export async function getSprintStats(sprintId: string): Promise<{
  total: number;
  completed: number;
  remaining: number;
}> {
  const supabase = createClient();

  const { count: total } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('sprint_id', sprintId)
    .is('parent_task_id', null);

  const { count: completed } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('sprint_id', sprintId)
    .is('parent_task_id', null)
    .eq('status', 'done');

  const t = total ?? 0;
  const c = completed ?? 0;

  return { total: t, completed: c, remaining: t - c };
}

export async function getProjectOverdueTasks(projectId: string): Promise<number> {
  const supabase = createClient();

  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('parent_task_id', null)
    .neq('status', 'done')
    .lt('due_date', new Date().toISOString());

  return count ?? 0;
}
