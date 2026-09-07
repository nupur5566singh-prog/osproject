'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  differenceInDays,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isPast,
  isWithinInterval,
} from 'date-fns';
import {
  TaskWithDetails,
  Milestone,
  ProjectMemberInfo,
  TaskStatus,
  getStatusInfo,
  getPriorityInfo,
} from '@/lib/types/tasks';
import { TaskDetailDialog } from '@/components/tasks/task-detail-dialog';
import { Subtask, CommentWithUser, TaskDependencyWithTask } from '@/lib/types/tasks';
import { createClient } from '@/lib/supabase/client';

interface TimelineViewProps {
  tasks: TaskWithDetails[];
  milestones: Milestone[];
  members: ProjectMemberInfo[];
  workspaceId: string;
  projectId: string;
  currentUserId: string;
}

type ScaleMode = 'week' | 'month';

export function TimelineView({
  tasks,
  milestones,
  members,
  workspaceId,
  projectId,
  currentUserId,
}: TimelineViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scaleMode, setScaleMode] = useState<ScaleMode>('month');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [detailSubtasks, setDetailSubtasks] = useState<Subtask[]>([]);
  const [detailComments, setDetailComments] = useState<CommentWithUser[]>([]);
  const [detailLabels, setDetailLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [detailDependencies, setDetailDependencies] = useState<TaskDependencyWithTask[]>([]);

  const handlePrev = () => {
    if (scaleMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    if (scaleMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

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

  // Generate the date range for the timeline
  const { days, totalDays, rangeStart, rangeEnd } = useMemo(() => {
    if (scaleMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = addDays(start, 6);
      const dayArray = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      return { days: dayArray, totalDays: 7, rangeStart: start, rangeEnd: end };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const dayArray: Date[] = [];
      let d = start;
      while (d <= end) {
        dayArray.push(d);
        d = addDays(d, 1);
      }
      return { days: dayArray, totalDays: dayArray.length, rangeStart: start, rangeEnd: end };
    }
  }, [currentDate, scaleMode]);

  const datedTasks = useMemo(() => tasks.filter((t) => t.start_date || t.due_date), [tasks]);
  const undatedTasks = useMemo(() => tasks.filter((t) => !t.start_date && !t.due_date), [tasks]);

  const DAY_WIDTH = 44;

  const getTaskPosition = useCallback(
    (task: TaskWithDetails) => {
      const start = task.start_date ? new Date(task.start_date) : task.due_date ? new Date(task.due_date) : null;
      const due = task.due_date ? new Date(task.due_date) : null;

      if (!start && !due) return null;
      if (!due) return null;

      const startDay = start ? Math.max(0, differenceInDays(start, rangeStart)) : 0;
      const endDay = Math.min(totalDays - 1, differenceInDays(due, rangeStart));

      if (endDay < 0 || startDay > totalDays - 1) return null;

      const hasRange = task.start_date && task.due_date && startDay !== endDay;
      return {
        left: Math.max(0, startDay) * DAY_WIDTH,
        width: hasRange ? Math.max(DAY_WIDTH, (endDay - Math.max(0, startDay) + 1) * DAY_WIDTH) : DAY_WIDTH,
        isPoint: !hasRange && !task.start_date,
      };
    },
    [rangeStart, totalDays]
  );

  const headerLabel = useMemo(() => {
    if (scaleMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = addDays(start, 6);
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  }, [currentDate, scaleMode]);

  const milestonesInRange = useMemo(
    () => milestones.filter((m) => {
      const d = new Date(m.due_date);
      return isWithinInterval(d, { start: rangeStart, end: rangeEnd });
    }),
    [milestones, rangeStart, rangeEnd]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-lg font-semibold">{headerLabel}</h2>
        </div>
        <div className="flex rounded-lg border border-border">
          {(['week', 'month'] as ScaleMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setScaleMode(mode)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                scaleMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {datedTasks.length === 0 && milestonesInRange.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No dated tasks yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add start and due dates to tasks to begin planning</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {/* Date header */}
          <div className="flex border-b border-border bg-secondary/30">
            <div className="w-56 shrink-0 border-r border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
              Task
            </div>
            <div className="overflow-x-auto">
              <div className="flex" style={{ width: totalDays * DAY_WIDTH }}>
                {days.map((date) => {
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div
                      key={date.toISOString()}
                      className={cn(
                        'flex flex-col items-center justify-center border-r border-border py-1.5 text-center',
                        isToday && 'bg-primary/10',
                        isWeekend && 'bg-secondary/20'
                      )}
                      style={{ width: DAY_WIDTH }}
                    >
                      <span className="text-[10px] font-medium text-muted-foreground">{format(date, 'EEE')}</span>
                      <span className={cn('text-xs font-medium', isToday && 'text-primary')}>{format(date, 'd')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Milestone rows */}
          {milestonesInRange.map((ms) => {
            const msDay = differenceInDays(new Date(ms.due_date), rangeStart);
            if (msDay < 0 || msDay > totalDays - 1) return null;
            return (
              <div key={ms.id} className="flex border-b border-border">
                <div className="flex w-56 shrink-0 items-center gap-2 border-r border-border px-3 py-2">
                  <Flag className="h-4 w-4 shrink-0 text-orange-500" />
                  <span className="truncate text-sm font-medium">{ms.name}</span>
                </div>
                <div className="relative overflow-x-auto" style={{ width: totalDays * DAY_WIDTH }}>
                  <div className="relative h-9" style={{ width: totalDays * DAY_WIDTH }}>
                    <div
                      className="absolute top-1/2 flex -translate-y-1/2 items-center gap-1"
                      style={{ left: msDay * DAY_WIDTH }}
                    >
                      <div className="flex h-5 w-5 rotate-45 items-center justify-center bg-orange-500" />
                      <span className="whitespace-nowrap text-xs font-medium text-orange-700">{format(new Date(ms.due_date), 'MMM d')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Task rows */}
          {datedTasks.map((task) => {
            const pos = getTaskPosition(task);
            const statusInfo = getStatusInfo(task.status);
            const priorityInfo = getPriorityInfo(task.priority);
            const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done';
            const assigneeName = task.assignee_name || task.assignee_email?.split('@')[0] || null;

            return (
              <div key={task.id} className="flex border-b border-border">
                <div className="flex w-56 shrink-0 items-center gap-2 border-r border-border px-3 py-2">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', statusInfo.color)} />
                  <button
                    onClick={() => handleTaskClick(task.id)}
                    className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
                  >
                    {task.title}
                  </button>
                  {assigneeName && (
                    <Avatar className="h-5 w-5 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                        {assigneeName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="relative overflow-x-auto" style={{ width: totalDays * DAY_WIDTH }}>
                  <div className="relative h-9" style={{ width: totalDays * DAY_WIDTH }}>
                    {pos && (
                      <button
                        onClick={() => handleTaskClick(task.id)}
                        className={cn(
                          'absolute top-1/2 flex h-7 -translate-y-1/2 items-center gap-1.5 overflow-hidden rounded-md px-2 text-xs font-medium text-white transition-shadow hover:shadow-md',
                          pos.isPoint ? 'rotate-45 bg-orange-500' : cn(statusInfo.color, 'opacity-90')
                        )}
                        style={{
                          left: pos.left,
                          width: pos.isPoint ? 24 : pos.width,
                        }}
                        title={task.title}
                      >
                        {!pos.isPoint && (
                          <span className="truncate">{task.title}</span>
                        )}
                      </button>
                    )}
                    {isOverdue && pos && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-red-500"
                        style={{ left: pos.left + pos.width - 2 }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Undated tasks */}
      {undatedTasks.length > 0 && (
        <div className="rounded-lg border border-border">
          <div className="border-b border-border bg-secondary/30 px-4 py-2 text-sm font-semibold text-muted-foreground">
            Undated Tasks ({undatedTasks.length})
          </div>
          <div className="divide-y divide-border">
            {undatedTasks.map((task) => {
              const statusInfo = getStatusInfo(task.status);
              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-secondary/20"
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', statusInfo.color)} />
                  <span className="text-sm">{task.title}</span>
                  {!task.due_date && <span className="text-xs text-muted-foreground">No dates set</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={selectedTask}
        subtasks={detailSubtasks}
        comments={detailComments}
        labels={[]}
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
