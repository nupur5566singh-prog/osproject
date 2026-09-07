'use client';

import { createClient } from '@/lib/supabase/client';
import { NotificationPreferences } from '@/lib/types/tasks';

export async function markNotificationRead(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in');

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .is('read_at', null);

  if (error) throw new Error(error.message);
}

export async function updateNotificationPreferences(prefs: Partial<Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>>) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in');

  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('notification_preferences')
      .update(prefs)
      .eq('user_id', user.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('notification_preferences')
      .insert({ user_id: user.id, ...prefs });
    if (error) throw new Error(error.message);
  }
}
