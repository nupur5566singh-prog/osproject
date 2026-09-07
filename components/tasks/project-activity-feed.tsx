'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  Plus,
  Users,
  MessageSquare,
  Rocket,
  CircleDot,
  Flag,
  Activity as ActivityIcon,
} from 'lucide-react';
import { ActivityEventWithUser } from '@/lib/types/tasks';

interface ProjectActivityFeedProps {
  activity: ActivityEventWithUser[];
}

export function ProjectActivityFeed({ activity }: ProjectActivityFeedProps) {
  if (activity.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">No activity yet</div>;
  }

  return (
    <div className="space-y-3">
      {activity.map((event) => (
        <ActivityRow key={event.id} event={event} />
      ))}
    </div>
  );
}

function ActivityRow({ event }: { event: ActivityEventWithUser }) {
  const meta = event.metadata ?? {};
  const title = (meta.title as string) ?? (meta.name as string) ?? '';
  const userName = event.user_name ?? 'Someone';
  const initials = (event.user_name ?? event.user_email ?? '?')[0]?.toUpperCase() ?? 'U';

  const icon = (() => {
    switch (event.event_type) {
      case 'task_completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'task_created': return <Plus className="h-4 w-4 text-blue-500" />;
      case 'task_assigned': return <Users className="h-4 w-4 text-purple-500" />;
      case 'comment_added': return <MessageSquare className="h-4 w-4 text-slate-500" />;
      case 'sprint_started': return <Rocket className="h-4 w-4 text-orange-500" />;
      case 'task_status_changed': return <CircleDot className="h-4 w-4 text-blue-500" />;
      case 'milestone_created': return <Flag className="h-4 w-4 text-orange-500" />;
      default: return <ActivityIcon className="h-4 w-4 text-muted-foreground" />;
    }
  })();

  const text = (() => {
    switch (event.event_type) {
      case 'task_completed': return `${userName} completed "${title}"`;
      case 'task_created': return `${userName} created "${title}"`;
      case 'task_assigned': return `${userName} assigned "${title}" to ${(meta.assignee as string) ?? 'someone'}`;
      case 'comment_added': return `${userName} commented on "${title}"`;
      case 'sprint_started': return `${userName} started sprint "${title}"`;
      case 'task_status_changed': return `${userName} moved "${title}" to ${(meta.new_status as string) ?? 'in_progress'}`;
      case 'task_priority_changed': return `${userName} changed priority of "${title}" to ${(meta.new_priority as string) ?? 'medium'}`;
      case 'milestone_created': return `${userName} created milestone "${title}"`;
      default: return `${userName} performed ${event.event_type}`;
    }
  })();

  return (
    <div className="flex items-center gap-3 text-sm">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{initials}</AvatarFallback>
      </Avatar>
      {icon}
      <span className="flex-1">{text}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
      </span>
    </div>
  );
}
