'use client';

import { createClient } from '@/lib/supabase/client';

export async function createMilestone(input: {
  workspace_id: string;
  project_id: string;
  name: string;
  description?: string | null;
  due_date: string;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in');

  const { data, error } = await supabase
    .from('milestones')
    .insert({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      due_date: new Date(input.due_date).toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateMilestone(id: string, updates: {
  name?: string;
  description?: string | null;
  due_date?: string;
}) {
  const supabase = createClient();

  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.due_date !== undefined) payload.due_date = new Date(updates.due_date).toISOString();

  const { data, error } = await supabase
    .from('milestones')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMilestone(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
