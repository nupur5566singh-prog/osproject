import { ComingSoon } from '@/components/shared/coming-soon';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Bell className="h-6 w-6 text-primary" />
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stay up to date with mentions, assignments, and activity across your workspaces.
        </p>
      </div>
      <ComingSoon
        feature="Notifications"
        description="Real-time notifications for task assignments, mentions, comments, and project updates — all in one place."
      />
    </div>
  );
}
