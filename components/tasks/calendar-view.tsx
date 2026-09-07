'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Search, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  isPast,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from 'date-fns';
import {
  TaskWithDetails,
  Milestone,
  ProjectMemberInfo,
  Label as LabelType,
  SprintWithStats,
  TaskStatus,
  TASK_PRIORITIES,
  TASK_STATUSES,
  getStatusInfo,
} from '@/lib/types/tasks';
import { TaskCreateDialog } from '@/components/tasks/task-create-dialog';
import { TaskDetailDialog } from '@/components/tasks/task-detail-dialog';
import { Subtask, CommentWithUser, TaskDependencyWithTask } from '@/lib/types/tasks';
import { createClient } from '@/lib/supabase/client';

interface CalendarViewProps {
  tasks: TaskWithDetails[];
  milestones: Milestone[];
  members: ProjectMemberInfo[];
  labels: LabelType[];
  sprints: SprintWithStats[];
  workspaceId: string;
  projectId: string;
  currentUserId: string;
}

type ViewMode = 'month' | 'week' | 'day';

export function CalendarView({
  tasks,
  milestones,
  members,
  labels,
  sprints,
  workspaceId,
  projectId,
  currentUserId,
}: CalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [detailSubtasks, setDetailSubtasks] = useState<Subtask[]>([]);
  const [detailComments, setDetailComments] = useState<CommentWithUser[]>([]);
  const [detailLabels, setDetailLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [detailDependencies, setDetailDependencies] = useState<TaskDependencyWithTask[]>([]);

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => t.due_date || t.start_date);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'me') result = result.filter((t) => t.assignee_id === currentUserId);
      else if (assigneeFilter === 'unassigned') result = result.filter((t) => !t.assignee_id);
      else result = result.filter((t) => t.assignee_id === assigneeFilter);
    }
    if (priorityFilter !== 'all') result = result.filter((t) => t.priority === priorityFilter);
    if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter);

    return result;
  }, [tasks, searchQuery, assigneeFilter, priorityFilter, statusFilter, currentUserId]);

  const tasksForDate = useCallback(
    (date: Date) => {
      return filteredTasks.filter((t) => {
        const start = t.start_date ? new Date(t.start_date) : null;
        const due = t.due_date ? new Date(t.due_date) : null;
        if (start && due) {
          return date >= startOfDate(start) && date <= endOfDate(due);
        }
        if (due) return isSameDay(date, due);
        if (start) return isSameDay(date, start);
        return false;
      });
    },
    [filteredTasks]
  );

  const milestonesForDate = useCallback(
    (date: Date) => milestones.filter((m) => isSameDay(new Date(m.due_date), date)),
    [milestones]
  );

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleDateClick = (date: Date) => {
    setPreselectedDate(format(date, 'yyyy-MM-dd'));
    setCreateOpen(true);
  };

  const handleTaskClick = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailOpen(true);

    const supabase = createClient();
    const [{ data: subtaskData }, { data: commentData }, { data: labelData }, { data: depData }] =
      await Promise.all([
        supabase.from('tasks').select('*, assignee:profiles!tasks_assignee_id_fkey(full_name)').eq('parent_task_id', taskId).order('created_at', { ascending: true }),
        supabase.from('comments').select('*, author:profiles!comments_user_id_fkey(full_name, email)').eq('task_id', taskId).order('created_at', { ascending: true }),
        supabase.from('task_labels').select('label:labels(id, name, color)').eq('task_id', taskId),
        supabase.from('task_dependencies').select('*, depends_on:tasks!task_dependencies_depends_on_task_id_fkey(title, status)').eq('task_id', taskId).order('created_at', { ascending: true }),
      ]);

    setDetailSubtasks((subtaskData as unknown as Subtask[])?.map((s) => ({ ...s, assignee_name: (s as unknown as { assignee: { full_name: string | null } | null }).assignee?.full_name ?? null })) ?? []);
    setDetailComments((commentData as unknown as CommentWithUser[]) ?? []);
    setDetailLabels((labelData as unknown as Array<{ label: { id: string; name: string; color: string } | null }>)?.map((i) => i.label).filter((l): l is { id: string; name: string; color: string } => l !== null) ?? []);
    setDetailDependencies((depData as unknown as TaskDependencyWithTask[]) ?? []);
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  const headerLabel = useMemo(() => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMM d, yyyy');
  }, [currentDate, viewMode]);

  // Month grid
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days: Date[] = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-lg font-semibold">{headerLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  viewMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9" />
        </div>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="me">My Tasks</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {TASK_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {TASK_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar grid */}
      {viewMode === 'month' && (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((date, i) => {
              const dayTasks = tasksForDate(date);
              const dayMilestones = milestonesForDate(date);
              const isToday = isSameDay(date, new Date());
              const inMonth = isSameMonth(date, currentDate);
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[100px] border-b border-r border-border p-1.5 transition-colors hover:bg-secondary/20',
                    !inMonth && 'bg-secondary/10',
                    (i + 1) % 7 === 0 && 'border-r-0'
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <button
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
                        isToday ? 'bg-primary text-primary-foreground' : inMonth ? 'text-foreground hover:bg-secondary' : 'text-muted-foreground/50'
                      )}
                    >
                      {format(date, 'd')}
                    </button>
                    {dayTasks.length > 0 && (
                      <span className="text-xs text-muted-foreground">{dayTasks.length}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayMilestones.map((ms) => (
                      <div key={ms.id} className="flex items-center gap-1 rounded bg-orange-500/10 px-1.5 py-0.5 text-xs text-orange-700">
                        <Flag className="h-3 w-3 shrink-0" />
                        <span className="truncate">{ms.name}</span>
                      </div>
                    ))}
                    {dayTasks.slice(0, 3).map((task) => {
                      const statusInfo = getStatusInfo(task.status);
                      const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done';
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleTaskClick(task.id)}
                          className={cn(
                            'flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-xs transition-colors hover:bg-secondary/40',
                            isOverdue && 'ring-1 ring-red-400/40'
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusInfo.color)} />
                          <span className={cn('truncate', task.status === 'done' && 'text-muted-foreground line-through')}>
                            {task.title}
                          </span>
                        </button>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div className="px-1.5 text-xs text-muted-foreground">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {viewMode === 'week' && (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
            {weekDays.map((date) => {
              const isToday = isSameDay(date, new Date());
              return (
                <div key={date.toISOString()} className="px-2 py-2 text-center">
                  <div className="text-xs font-medium text-muted-foreground">{format(date, 'EEE')}</div>
                  <div className={cn('mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium', isToday ? 'bg-primary text-primary-foreground' : '')}>
                    {format(date, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7">
            {weekDays.map((date) => {
              const dayTasks = tasksForDate(date);
              const dayMilestones = milestonesForDate(date);
              return (
                <div key={date.toISOString()} className="min-h-[300px] border-r border-border p-2 last:border-r-0">
                  <div className="space-y-2">
                    {dayMilestones.map((ms) => (
                      <div key={ms.id} className="flex items-center gap-1 rounded bg-orange-500/10 px-2 py-1 text-xs text-orange-700">
                        <Flag className="h-3 w-3 shrink-0" />
                        <span className="truncate font-medium">{ms.name}</span>
                      </div>
                    ))}
                    {dayTasks.map((task) => {
                      const statusInfo = getStatusInfo(task.status);
                      const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done';
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleTaskClick(task.id)}
                          className={cn(
                            'w-full rounded-md border-l-2 bg-secondary/20 p-2 text-left transition-colors hover:bg-secondary/40',
                            statusInfo.color,
                            isOverdue && 'ring-1 ring-red-400/40'
                          )}
                        >
                          <div className={cn('text-xs font-medium', task.status === 'done' && 'text-muted-foreground line-through')}>
                            {task.title}
                          </div>
                          {task.assignee_name && (
                            <div className="mt-1 text-xs text-muted-foreground">{task.assignee_name}</div>
                          )}
                        </button>
                      );
                    })}
                    {dayTasks.length === 0 && dayMilestones.length === 0 && (
                      <button onClick={() => handleDateClick(date)} className="flex w-full items-center justify-center py-4 text-xs text-muted-foreground/50 hover:text-muted-foreground">
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day view */}
      {viewMode === 'day' && (
        <div className="rounded-lg border border-border p-4">
          <div className="space-y-2">
            {tasksForDate(currentDate).length === 0 && milestonesForDate(currentDate).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No scheduled tasks</p>
                <button onClick={() => handleDateClick(currentDate)} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus className="h-3 w-3" /> Create task
                </button>
              </div>
            ) : (
              <>
                {milestonesForDate(currentDate).map((ms) => (
                  <div key={ms.id} className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2 text-sm">
                    <Flag className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{ms.name}</span>
                    {ms.description && <span className="text-muted-foreground">— {ms.description}</span>}
                  </div>
                ))}
                {tasksForDate(currentDate).map((task) => {
                  const statusInfo = getStatusInfo(task.status);
                  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done';
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/20',
                        isOverdue && 'border-red-400/40'
                      )}
                    >
                      <span className={cn('h-2.5 w-2.5 rounded-full', statusInfo.color)} />
                      <div className="flex-1">
                        <div className={cn('text-sm font-medium', task.status === 'done' && 'text-muted-foreground line-through')}>
                          {task.title}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {task.assignee_name ?? 'Unassigned'}
                          {task.due_date && ` · Due ${format(new Date(task.due_date), 'MMM d')}`}
                        </div>
                      </div>
                      {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        projectId={projectId}
        members={members}
        labels={labels}
        preselectedDueDate={preselectedDate}
        onCreated={() => router.refresh()}
      />

      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={selectedTask}
        subtasks={detailSubtasks}
        comments={detailComments}
        labels={labels}
        taskLabels={detailLabels}
        dependencies={detailDependencies}
        members={members}
        projectTasks={tasks}
        workspaceId={workspaceId}
        projectId={projectId}
        currentUserId={currentUserId}
      />
    </div>
  );
}

function startOfDate(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function endOfDate(d: Date): Date {
  const n = new Date(d);
  n.setHours(23, 59, 59, 999);
  return n;
}
