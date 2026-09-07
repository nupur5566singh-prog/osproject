'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Notification, NOTIFICATION_TYPE_LABELS } from '@/lib/types/tasks';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/mutations/notifications';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifications((data as unknown as Notification[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    try {
      await markAllNotificationsRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleClick = (n: Notification) => {
    if (!n.read_at) handleMarkRead(n.id);
    if (n.task_id && n.project_id) {
      // Navigate to the task's project — task detail will need project context
      router.push(`/app/workspaces/${n.workspace_id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-secondary/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
            {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount} unread</Badge>}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay up to date with mentions, assignments, and activity across your workspaces.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium">You&apos;re all caught up!</p>
              <p className="mt-1 text-xs text-muted-foreground">No notifications to show.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-secondary/20',
                    !n.read_at && 'bg-primary/5'
                  )}
                >
                  <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-primary')} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{n.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}
                      </Badge>
                    </div>
                    {n.message && <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {!n.read_at && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}>
                      Mark read
                    </Button>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
