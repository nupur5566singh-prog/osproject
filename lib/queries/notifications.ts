import { createClient } from '@/lib/supabase/server';
import { Notification, NotificationPreferences } from '@/lib/types/tasks';

interface NotificationRow extends Omit<Notification, 'workspace_id'> {}

export async function getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as unknown as Notification[];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient();

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);

  return count ?? 0;
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return null;
  return data as unknown as NotificationPreferences;
}
