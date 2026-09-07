'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { NotificationPreferences } from '@/lib/types/tasks';
import { updateNotificationPreferences } from '@/lib/mutations/notifications';
import { createClient } from '@/lib/supabase/client';

const PREF_KEYS: Array<{ key: keyof Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'>; label: string; description: string }> = [
  { key: 'task_assignments', label: 'Task assignments', description: 'When someone assigns a task to you' },
  { key: 'mentions', label: 'Mentions', description: 'When someone mentions you in a comment' },
  { key: 'comments', label: 'Comments', description: 'When someone comments on your tasks' },
  { key: 'due_dates', label: 'Due dates', description: 'Reminders for upcoming and overdue tasks' },
  { key: 'project_activity', label: 'Project activity', description: 'Important changes in your projects' },
  { key: 'sprint_activity', label: 'Sprint activity', description: 'Sprint starts and completions' },
];

export function NotificationPreferencesCard() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setPrefs(data as unknown as NotificationPreferences ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const handleToggle = async (key: typeof PREF_KEYS[number]['key'], value: boolean) => {
    setPrefs((prev) => ({
      user_id: user?.id ?? '',
      task_assignments: prev?.task_assignments ?? true,
      mentions: prev?.mentions ?? true,
      comments: prev?.comments ?? true,
      due_dates: prev?.due_dates ?? true,
      project_activity: prev?.project_activity ?? true,
      sprint_activity: prev?.sprint_activity ?? true,
      [key]: value,
    }));

    setSaving(true);
    try {
      await updateNotificationPreferences({ [key]: value });
    } catch {
      toast.error('Failed to update preferences');
      fetchPrefs();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PREF_KEYS.map((p) => (
              <div key={p.key} className="h-12 animate-pulse rounded bg-secondary/20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
        <CardDescription>Choose which notifications you want to receive.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {PREF_KEYS.map((p) => {
            const value = prefs?.[p.key] ?? true;
            return (
              <div key={p.key} className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{p.label}</Label>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(v) => handleToggle(p.key, v)}
                  disabled={saving}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
