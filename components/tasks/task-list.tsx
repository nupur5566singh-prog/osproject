'use client';

import { useState } from 'react';
import { TaskWithDetails } from '@/lib/types/tasks';
import { getStatusInfo, getPriorityInfo } from '@/lib/types/tasks';
import { format, isPast, isToday } from 'date-fns';
import { CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: TaskWithDetails[];
  onTaskClick: (taskId: string) => void;
}

export function TaskList({ tasks, onTaskClick }: TaskListProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header */}
      <div className="hidden border-b border-border bg-secondary/50 px-4 py-2.5 sm:flex">
        <div className="flex w-full items-center gap-3 text-xs font-medium text-muted-foreground">
          <div className="w-6" />
          <div className="flex-1">Task</div>
          <div className="w-20 text-center">Priority</div>
          <div className="w-28">Assignee</div>
          <div className="w-24">Labels</div>
          <div className="w-24">Due date</div>
          <div className="w-16 text-center">Subtasks</div>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
        ))}
      </div>
    </div>
  );
}

function TaskRow({ task, onClick }: { task: TaskWithDetails; onClick: () => void }) {
  const statusInfo = getStatusInfo(task.status);
  const priorityInfo = getPriorityInfo(task.priority);
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'done';
  const isDueToday = dueDate && isToday(dueDate);
  const assigneeName = task.assignee_name || task.assignee_email?.split('@')[0] || null;
  const hasSubtasks = task.subtask_count > 0;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/40"
    >
      {/* Status icon */}
      <div className="w-6 shrink-0">
        {task.status === 'done' ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className={cn('h-4 w-4', statusInfo.color)} />
        )}
      </div>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <span className={cn(
          'block truncate text-sm font-medium',
          task.status === 'done' && 'text-muted-foreground line-through'
        )}>
          {task.title}
        </span>
      </div>

      {/* Priority */}
      <div className="hidden w-20 shrink-0 sm:block">
        <span className={cn('flex items-center justify-center gap-1 text-xs font-medium', priorityInfo.color)}>
          <span className={cn('h-2 w-2 rounded-full', priorityInfo.dot)} />
          {priorityInfo.label}
        </span>
      </div>

      {/* Assignee */}
      <div className="hidden w-28 shrink-0 sm:block">
        {assigneeName ? (
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {assigneeName[0]?.toUpperCase()}
            </div>
            <span className="truncate text-xs text-muted-foreground">{assigneeName}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">Unassigned</span>
        )}
      </div>

      {/* Labels */}
      <div className="hidden w-24 shrink-0 sm:block">
        {task.labels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 2).map((label) => (
              <span
                key={label.id}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
            {task.labels.length > 2 && (
              <span className="text-xs text-muted-foreground">+{task.labels.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/30">—</span>
        )}
      </div>

      {/* Due date */}
      <div className="hidden w-24 shrink-0 sm:block">
        {dueDate ? (
          <span className={cn(
            'flex items-center gap-1 text-xs',
            isOverdue ? 'text-red-600 font-medium' : isDueToday ? 'text-orange-600 font-medium' : 'text-muted-foreground'
          )}>
            <Clock className="h-3 w-3" />
            {format(dueDate, 'MMM d')}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30">—</span>
        )}
      </div>

      {/* Subtask progress */}
      <div className="hidden w-16 shrink-0 text-center sm:block">
        {hasSubtasks ? (
          <span className="text-xs font-medium text-muted-foreground">
            {task.subtask_done_count}/{task.subtask_count}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30">—</span>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
    </button>
  );
}
