'use client';

import { createClient } from '@/lib/supabase/client';
import { SprintStatus, TaskStatus } from '@/lib/types/tasks';

export interface CreateSprintInput {
  workspace_id: string;
  project_id: string;
  name: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string | null;
  status?: SprintStatus;
  start_date?: string | null;
  end_date?: string | null;
}

export async function createSprint(input: CreateSprintInput) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in');

  const { data, error } = await supabase
    .from('sprints')
    .insert({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      name: input.name.trim(),
      goal: input.goal?.trim() || null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateSprint(sprintId: string, updates: UpdateSprintInput) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sprints')
    .update({
      ...updates,
      name: updates.name?.trim(),
      goal: updates.goal !== undefined ? (updates.goal?.trim() || null) : undefined,
    })
    .eq('id', sprintId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSprint(sprintId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('sprints')
    .delete()
    .eq('id', sprintId);

  if (error) throw new Error(error.message);
}

export async function startSprint(sprintId: string) {
  return updateSprint(sprintId, { status: 'active' });
}

export async function completeSprint(sprintId: string, incompleteTaskAction: 'backlog' | 'keep' | 'sprint', targetSprintId?: string | null) {
  const supabase = createClient();

  if (incompleteTaskAction === 'backlog') {
    await supabase
      .from('tasks')
      .update({ sprint_id: null })
      .eq('sprint_id', sprintId)
      .neq('status', 'done');
  } else if (incompleteTaskAction === 'sprint' && targetSprintId) {
    await supabase
      .from('tasks')
      .update({ sprint_id: targetSprintId })
      .eq('sprint_id', sprintId)
      .neq('status', 'done');
  }

  return updateSprint(sprintId, { status: 'completed' });
}

export async function moveTaskToSprint(taskId: string, sprintId: string | null) {
  const supabase = createClient();

  const { error } = await supabase
    .from('tasks')
    .update({ sprint_id: sprintId })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = createClient();

  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

export async function updateTaskPosition(taskId: string, position: number) {
  const supabase = createClient();

  const { error } = await supabase
    .from('tasks')
    .update({ position })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

export async function updateTaskStatusAndPosition(taskId: string, status: TaskStatus, position: number) {
  const supabase = createClient();

  const { error } = await supabase
    .from('tasks')
    .update({ status, position })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}
