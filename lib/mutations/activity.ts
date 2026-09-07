'use client';

import { createClient } from '@/lib/supabase/client';

export async function createActivityEvent(input: {
  workspace_id: string;
  project_id?: string | null;
  task_id?: string | null;
  event_type: string;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('activity_events').insert({
    workspace_id: input.workspace_id,
    project_id: input.project_id ?? null,
    task_id: input.task_id ?? null,
    user_id: user.id,
    event_type: input.event_type,
    metadata: input.metadata ?? null,
  });

  if (error) {
    // Activity logging is best-effort — don't throw
  }
}

export async function createNotification(input: {
  workspace_id: string;
  recipient_id: string;
  type: string;
  title: string;
  message?: string | null;
  task_id?: string | null;
  project_id?: string | null;
  comment_id?: string | null;
}) {
  const supabase = createClient();

  const { error } = await supabase.from('notifications').insert({
    workspace_id: input.workspace_id,
    recipient_id: input.recipient_id,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    task_id: input.task_id ?? null,
    project_id: input.project_id ?? null,
    comment_id: input.comment_id ?? null,
  });

  if (error) {
    // Notification creation is best-effort
  }
}
