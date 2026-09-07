'use client';

import { createClient } from '@/lib/supabase/client';

export async function watchTask(taskId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in');

  const { error } = await supabase
    .from('task_watchers')
    .insert({ task_id: taskId, user_id: user.id });

  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function unwatchTask(taskId: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in');

  const { error } = await supabase
    .from('task_watchers')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

export async function isWatchingTask(taskId: string): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('task_watchers')
    .select('task_id')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .maybeSingle();

  return !!data;
}

export async function getWatchedTaskIds(taskIds: string[]): Promise<Set<string>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || taskIds.length === 0) return new Set();

  const { data } = await supabase
    .from('task_watchers')
    .select('task_id')
    .in('task_id', taskIds)
    .eq('user_id', user.id);

  return new Set((data ?? []).map((w: { task_id: string }) => w.task_id));
}
