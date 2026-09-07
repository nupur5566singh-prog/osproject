import { createClient } from '@/lib/supabase/server';
import { Milestone } from '@/lib/types/tasks';

export async function getProjectMilestones(projectId: string): Promise<Milestone[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true });

  if (error || !data) return [];
  return data as unknown as Milestone[];
}
