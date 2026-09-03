'use client';

import { createClient } from '@/lib/supabase/client';
import { TaskStatus, TaskPriority } from '@/lib/types/tasks';

export interface CreateTaskInput {
  workspace_id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  parent_task_id?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  start_date?: string | null;
  due_date?: string | null;
}

export async function createTask(input: CreateTaskInput) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'none',
      assignee_id: input.assignee_id ?? null,
      start_date: input.start_date ?? null,
      due_date: input.due_date ?? null,
      parent_task_id: input.parent_task_id ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTask(taskId: string, updates: UpdateTaskInput) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      title: updates.title?.trim(),
      description: updates.description !== undefined ? (updates.description?.trim() || null) : undefined,
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTask(taskId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}

export async function createComment(taskId: string, content: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteComment(commentId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw new Error(error.message);
}

export async function createLabel(workspaceId: string, name: string, color: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('labels')
    .insert({
      workspace_id: workspaceId,
      name: name.trim(),
      color,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLabel(labelId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('labels')
    .delete()
    .eq('id', labelId);

  if (error) throw new Error(error.message);
}

export async function addLabelToTask(taskId: string, labelId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('task_labels')
    .insert({ task_id: taskId, label_id: labelId });

  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function removeLabelFromTask(taskId: string, labelId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId);

  if (error) throw new Error(error.message);
}

export async function addTaskDependency(taskId: string, dependsOnTaskId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('task_dependencies')
    .insert({ task_id: taskId, depends_on_task_id: dependsOnTaskId });

  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function removeTaskDependency(dependencyId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('id', dependencyId);

  if (error) throw new Error(error.message);
}
