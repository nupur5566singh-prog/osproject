'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Settings,
  Code2,
  LayoutGrid,
  Calendar,
  FolderKanban,
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Rocket,
  Flag,
  Home,
  ListTodo,
  Bell,
  Menu,
  LogOut,
  ChevronDown,
  Plus,
  FlaskConical,
  Users,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { TaskBoard } from '@/components/tasks/task-board';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { BacklogView } from '@/components/tasks/backlog-view';
import { SprintsView } from '@/components/tasks/sprints-view';
import { CalendarView } from '@/components/tasks/calendar-view';
import { TimelineView } from '@/components/tasks/timeline-view';
import { MilestoneCreateDialog } from '@/components/tasks/milestone-create-dialog';
import {
  TaskWithDetails,
  SprintWithStats,
  Milestone,
  ProjectMemberInfo,
  Label as LabelType,
  Notification,
  ActivityEventWithUser,
  getSprintStatusInfo,
  getStatusInfo,
} from '@/lib/types/tasks';
import {
  DEMO_TASKS,
  DEMO_SPRINTS,
  DEMO_MILESTONES,
  DEMO_MEMBERS,
  DEMO_LABELS,
  DEMO_NOTIFICATIONS,
  DEMO_ACTIVITY,
  DEMO_WORKSPACE,
  DEMO_PROJECT,
  DEMO_USER,
} from '@/lib/demo/demo-data';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DemoPage() {
  const [tasks, setTasks] = useState<TaskWithDetails[]>(DEMO_TASKS);
  const [sprints] = useState<SprintWithStats[]>(DEMO_SPRINTS);
  const [milestones, setMilestones] = useState<Milestone[]>(DEMO_MILESTONES);
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [milestoneCreateOpen, setMilestoneCreateOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    return { total, completed, remaining: total - completed };
  }, [tasks]);

  const overdueCount = useMemo(
    () => tasks.filter((t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'done').length,
    [tasks]
  );

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const activeSprint = sprints.find((s) => s.status === 'active') ?? null;

  const handleReset = () => {
    setTasks(DEMO_TASKS);
    setMilestones(DEMO_MILESTONES);
    setNotifications(DEMO_NOTIFICATIONS);
    setResetKey((k) => k + 1);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  };

  const handleAddMilestone = (ms: Milestone) => {
    setMilestones((prev) => [...prev, ms]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Demo Sidebar */}
      <aside className="hidden w-64 shrink-0 bg-sidebar lg:flex lg:flex-col">
        <div className="px-3 py-4">
          <Logo variant="dark" />
        </div>
        <div className="px-3 pb-3">
          <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                D
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{DEMO_WORKSPACE.name}</div>
                <div className="text-xs text-sidebar-foreground/50">Owner</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <nav className="space-y-1">
            {[
              { label: 'Home', icon: Home },
              { label: 'My Tasks', icon: ListTodo },
              { label: 'Projects', icon: FolderKanban },
              { label: 'Team', icon: Users },
              { label: 'Notifications', icon: Bell, badge: unreadCount },
              { label: 'Settings', icon: Settings },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white transition-colors cursor-default"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </div>
            ))}
          </nav>
        </div>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex w-full items-center gap-2 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-xs font-medium text-primary">A</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-medium text-white">{DEMO_USER.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Demo banner */}
        <div className="flex items-center justify-center gap-2 bg-amber-500/10 py-1.5 text-xs font-medium text-amber-700">
          <FlaskConical className="h-3.5 w-3.5" />
          DEMO / PREVIEW MODE — Sample data, no real authentication
          <button
            onClick={handleReset}
            className="ml-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-amber-700 underline hover:bg-amber-500/20"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8" key={resetKey}>
          {/* Breadcrumb */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>

          {/* Project header */}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                <Code2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{DEMO_PROJECT.name}</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{DEMO_PROJECT.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">Software Development</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Created {formatDistanceToNow(new Date(DEMO_PROJECT.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="backlog">Backlog</TabsTrigger>
              <TabsTrigger value="sprints">Sprints</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total tasks</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{stats.completed}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                      <CircleDot className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{stats.remaining}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{overdueCount}</div>
                      <div className="text-xs text-muted-foreground">Overdue</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {activeSprint && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Rocket className="h-4 w-4 text-blue-500" />
                      Active Sprint
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{activeSprint.name}</span>
                          <Badge className={cn('text-xs', getSprintStatusInfo('active').badge)}>Active</Badge>
                        </div>
                        {activeSprint.goal && <p className="mt-1 text-sm text-muted-foreground">{activeSprint.goal}</p>}
                        {activeSprint.end_date && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ends {format(new Date(activeSprint.end_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {activeSprint.completed_tasks}
                          <span className="text-base text-muted-foreground">/{activeSprint.total_tasks}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">tasks done</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Milestones */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Flag className="h-4 w-4 text-orange-500" />
                      Milestones
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setMilestoneCreateOpen(true)}>
                      <Plus className="mr-1 h-4 w-4" /> New Milestone
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {milestones.map((ms) => (
                      <div key={ms.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <Flag className="h-5 w-5 shrink-0 text-orange-500" />
                        <div className="flex-1">
                          <div className="font-medium">{ms.name}</div>
                          {ms.description && <div className="text-sm text-muted-foreground">{ms.description}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{format(new Date(ms.due_date), 'MMM d, yyyy')}</div>
                          <div className={cn('text-xs', isPast(new Date(ms.due_date)) ? 'text-red-600' : 'text-muted-foreground')}>
                            {isPast(new Date(ms.due_date)) ? 'Overdue' : 'Upcoming'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {milestones.length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">No milestones yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent activity */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {DEMO_ACTIVITY.slice(0, 6).map((event) => (
                      <ActivityRow key={event.id} event={event} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* List */}
            <TabsContent value="list" className="mt-6">
              <TaskBoard
                tasks={tasks}
                members={DEMO_MEMBERS}
                labels={DEMO_LABELS}
                workspaceId={DEMO_WORKSPACE.id}
                projectId={DEMO_PROJECT.id}
                currentUserId={DEMO_USER.id}
              />
            </TabsContent>

            {/* Board */}
            <TabsContent value="board" className="mt-6">
              <KanbanBoard
                tasks={tasks}
                members={DEMO_MEMBERS}
                labels={DEMO_LABELS}
                workspaceId={DEMO_WORKSPACE.id}
                projectId={DEMO_PROJECT.id}
                currentUserId={DEMO_USER.id}
              />
            </TabsContent>

            {/* Backlog */}
            <TabsContent value="backlog" className="mt-6">
              <BacklogView
                tasks={tasks}
                sprints={sprints}
                members={DEMO_MEMBERS}
                labels={DEMO_LABELS}
                workspaceId={DEMO_WORKSPACE.id}
                projectId={DEMO_PROJECT.id}
                currentUserId={DEMO_USER.id}
              />
            </TabsContent>

            {/* Sprints */}
            <TabsContent value="sprints" className="mt-6">
              <SprintsView
                sprints={sprints}
                tasks={tasks}
                members={DEMO_MEMBERS}
                labels={DEMO_LABELS}
                workspaceId={DEMO_WORKSPACE.id}
                projectId={DEMO_PROJECT.id}
                currentUserId={DEMO_USER.id}
              />
            </TabsContent>

            {/* Calendar */}
            <TabsContent value="calendar" className="mt-6">
              <CalendarView
                tasks={tasks}
                milestones={milestones}
                members={DEMO_MEMBERS}
                labels={DEMO_LABELS}
                sprints={sprints}
                workspaceId={DEMO_WORKSPACE.id}
                projectId={DEMO_PROJECT.id}
                currentUserId={DEMO_USER.id}
              />
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-6">
              <TimelineView
                tasks={tasks}
                milestones={milestones}
                members={DEMO_MEMBERS}
                workspaceId={DEMO_WORKSPACE.id}
                projectId={DEMO_PROJECT.id}
                currentUserId={DEMO_USER.id}
              />
            </TabsContent>

            {/* Team */}
            <TabsContent value="team" className="mt-6">
              <TeamViewDemo members={DEMO_MEMBERS} tasks={tasks} />
            </TabsContent>

            {/* Activity */}
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4" />
                    Project Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {DEMO_ACTIVITY.map((event) => (
                      <ActivityRow key={event.id} event={event} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="mt-6">
              <NotificationsViewDemo
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={(id) =>
                  setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n))
                  )
                }
              />
            </TabsContent>
          </Tabs>

          <MilestoneCreateDialog
            open={milestoneCreateOpen}
            onOpenChange={setMilestoneCreateOpen}
            workspaceId={DEMO_WORKSPACE.id}
            projectId={DEMO_PROJECT.id}
            onCreated={handleAddMilestone}
            isDemo
          />
        </div>
      </main>
    </div>
  );
}

function ActivityRow({ event }: { event: ActivityEventWithUser }) {
  const icon = useMemo(() => {
    switch (event.event_type) {
      case 'task_completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'task_created': return <Plus className="h-4 w-4 text-blue-500" />;
      case 'task_assigned': return <Users className="h-4 w-4 text-purple-500" />;
      case 'comment_added': return <Activity className="h-4 w-4 text-slate-500" />;
      case 'sprint_started': return <Rocket className="h-4 w-4 text-orange-500" />;
      case 'task_status_changed': return <CircleDot className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  }, [event.event_type]);

  const text = useMemo(() => {
    const meta = event.metadata ?? {};
    const title = (meta.title as string) ?? (meta.name as string) ?? '';
    const userName = event.user_name ?? 'Someone';
    switch (event.event_type) {
      case 'task_completed': return `${userName} completed "${title}"`;
      case 'task_created': return `${userName} created "${title}"`;
      case 'task_assigned': return `${userName} assigned "${title}" to ${(meta.assignee as string) ?? 'someone'}`;
      case 'comment_added': return `${userName} commented on "${title}"`;
      case 'sprint_started': return `${userName} started sprint "${title}"`;
      case 'task_status_changed': return `${userName} moved "${title}" from ${(meta.old_status as string) ?? 'todo'} to ${(meta.new_status as string) ?? 'in_progress'}`;
      case 'task_priority_changed': return `${userName} changed priority of "${title}" to ${(meta.new_priority as string) ?? 'medium'}`;
      default: return `${userName} performed ${event.event_type}`;
    }
  }, [event]);

  return (
    <div className="flex items-center gap-3 text-sm">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
          {(event.user_name ?? event.user_email ?? '?')[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {icon}
      <span className="flex-1">{text}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
      </span>
    </div>
  );
}

function TeamViewDemo({ members, tasks }: { members: ProjectMemberInfo[]; tasks: TaskWithDetails[] }) {
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      if (t.assignee_id) counts[t.assignee_id] = (counts[t.assignee_id] ?? 0) + 1;
    }
    return counts;
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Team Members
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                  {(m.full_name ?? m.email ?? '?')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{m.full_name ?? 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">{m.email}</div>
              </div>
              <Badge variant="secondary" className="capitalize">{m.role}</Badge>
              <div className="text-right">
                <div className="text-lg font-bold">{taskCounts[m.user_id] ?? 0}</div>
                <div className="text-xs text-muted-foreground">tasks</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsViewDemo({
  notifications,
  onMarkAllRead,
  onMarkRead,
}: {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}) {
  const unread = notifications.filter((n) => !n.read_at).length;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Notifications
            {unread > 0 && <Badge className="bg-red-500 text-white">{unread} unread</Badge>}
          </CardTitle>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={onMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                n.read_at ? 'border-border' : 'border-primary/30 bg-primary/5'
              )}
            >
              <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-primary')} />
              <div className="flex-1">
                <div className="font-medium">{n.title}</div>
                {n.message && <div className="text-sm text-muted-foreground">{n.message}</div>}
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </div>
              </div>
              {!n.read_at && (
                <Button variant="ghost" size="sm" onClick={() => onMarkRead(n.id)}>
                  Mark read
                </Button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up!</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
