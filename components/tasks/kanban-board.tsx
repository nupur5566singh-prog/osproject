'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';
import {
  TaskWithDetails,
  ProjectMemberInfo,
  Label as LabelType,
  TaskStatus,
  TaskPriority,
  TASK_STATUSES,
  TASK_PRIORITIES,
  getStatusInfo,
  getPriorityInfo,
} from '@/lib/types/tasks';
import { updateTaskStatusAndPosition } from '@/lib/mutations/sprints';
import { TaskCreateDialog } from '@/components/tasks/task-create-dialog';
import { TaskDetailDialog } from '@/components/tasks/task-detail-dialog';
import { Subtask, CommentWithUser, TaskDependencyWithTask } from '@/lib/types/tasks';
import { createClient } from '@/lib/supabase/client';

interface KanbanBoardProps {
  tasks: TaskWithDetails[];
  members: ProjectMemberInfo[];
  labels: LabelType[];
  workspaceId: string;
  projectId: string;
  currentUserId: string;
  sprintFilter?: string | null;
}

type SortOption = 'priority' | 'due_date' | 'created';

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0, high: 1, medium: 2, low: 3, none: 4,
};

export function KanbanBoard({
  tasks,
  members,
  labels,
  workspaceId,
  projectId,
  currentUserId,
  sprintFilter = null,
}: KanbanBoardProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('todo');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<TaskWithDetails[] | null>(null);

  // Detail data state
  const [detailSubtasks, setDetailSubtasks] = useState<Subtask[]>([]);
  const [detailComments, setDetailComments] = useState<CommentWithUser[]>([]);
  const [detailLabels, setDetailLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [detailDependencies, setDetailDependencies] = useState<TaskDependencyWithTask[]>([]);

  const displayTasks = optimisticTasks ?? tasks;

  const filteredTasks = useMemo(() => {
    let result = displayTasks;

    if (sprintFilter) {
      result = result.filter((t) => t.sprint_id === sprintFilter);
    } else if (sprintFilter === null && sprintFilter !== undefined) {
      // No sprint filter — show all
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'me') {
        result = result.filter((t) => t.assignee_id === currentUserId);
      } else {
        result = result.filter((t) => t.assignee_id === assigneeFilter);
      }
    }

    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (labelFilter !== 'all') {
      result = result.filter((t) => t.labels.some((l) => l.id === labelFilter));
    }

    return result;
  }, [displayTasks, searchQuery, assigneeFilter, priorityFilter, labelFilter, sprintFilter, currentUserId]);

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: 'border-t-slate-400' },
    { status: 'in_progress', label: 'In Progress', color: 'border-t-blue-500' },
    { status: 'done', label: 'Done', color: 'border-t-green-500' },
  ];

  const tasksByStatus = useCallback((status: TaskStatus) => {
    const colTasks = filteredTasks.filter((t) => t.status === status);
    if (sortBy === 'priority') {
      return [...colTasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    } else if (sortBy === 'due_date') {
      return [...colTasks].sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    } else {
      return [...colTasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [filteredTasks, sortBy]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId || !draggingId) return;

    const task = displayTasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) {
      setDraggingId(null);
      return;
    }

    // Optimistic update
    const colTasks = tasksByStatus(targetStatus);
    const newPosition = colTasks.length > 0
      ? (colTasks[colTasks.length - 1].position ?? 1000) + 1000
      : 1000;

    setOptimisticTasks(
      displayTasks.map((t) =>
        t.id === taskId ? { ...t, status: targetStatus, position: newPosition } : t
      )
    );

    try {
      await updateTaskStatusAndPosition(taskId, targetStatus, newPosition);
      toast.success(`Moved to ${getStatusInfo(targetStatus).label}`);
      setOptimisticTasks(null);
      router.refresh();
    } catch (err) {
      // Revert on failure
      setOptimisticTasks(null);
      toast.error(err instanceof Error ? err.message : 'Failed to move task');
    }

    setDraggingId(null);
  };

  const handleTaskClick = useCallback(async (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailOpen(true);

    const supabase = createClient();

    const [{ data: subtaskData }, { data: commentData }, { data: labelData }, { data: depData }] =
      await Promise.all([
        supabase
          .from('tasks')
          .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name)')
          .eq('parent_task_id', taskId)
          .order('created_at', { ascending: true }),
        supabase
          .from('comments')
          .select('*, author:profiles!comments_user_id_fkey(full_name, email)')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true }),
        supabase
          .from('task_labels')
          .select('label:labels(id, name, color)')
          .eq('task_id', taskId),
        supabase
          .from('task_dependencies')
          .select('*, depends_on:tasks!task_dependencies_depends_on_task_id_fkey(title, status)')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true }),
      ]);

    setDetailSubtasks(
      (subtaskData as unknown as Array<{ assignee: { full_name: string | null } | null } & Subtask>)?.map((s) => ({
        ...s,
        assignee_name: s.assignee?.full_name ?? null,
      })) ?? []
    );
    setDetailComments(
      (commentData as unknown as Array<{ author: { full_name: string | null; email: string | null } | null } & CommentWithUser>)?.map((c) => ({
        id: c.id, task_id: c.task_id, user_id: c.user_id, content: c.content,
        created_at: c.created_at, updated_at: c.updated_at,
        author_name: c.author?.full_name ?? null, author_email: c.author?.email ?? null,
      })) ?? []
    );
    setDetailLabels(
      (labelData as unknown as Array<{ label: { id: string; name: string; color: string } | null }>)
        ?.map((item) => item.label)
        .filter((l): l is { id: string; name: string; color: string } => l !== null) ?? []
    );
    setDetailDependencies(
      (depData as unknown as Array<{
        id: string; task_id: string; depends_on_task_id: string; created_at: string;
        depends_on: { title: string; status: string } | null;
      }>)?.map((d) => ({
        id: d.id, task_id: d.task_id, depends_on_task_id: d.depends_on_task_id, created_at: d.created_at,
        depends_on_title: d.depends_on?.title ?? 'Unknown',
        depends_on_status: (d.depends_on?.status as TaskStatus) ?? 'todo',
      })) ?? []
    );
  }, []);

  const selectedTask = displayTasks.find((t) => t.id === selectedTaskId) ?? null;

  const openCreateInColumn = (status: TaskStatus) => {
    setCreateStatus(status);
    setCreateOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            <SelectItem value="me">Assigned to me</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {labels.length > 0 && (
          <Select value={labelFilter} onValueChange={setLabelFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Label" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All labels</SelectItem>
              {labels.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Sort: Priority</SelectItem>
            <SelectItem value="due_date">Sort: Due date</SelectItem>
            <SelectItem value="created">Sort: Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Board columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = tasksByStatus(col.status);
          return (
            <div
              key={col.status}
              className={cn(
                'flex w-[300px] shrink-0 flex-col rounded-lg border border-t-4 bg-secondary/30',
                col.color,
                dragOverCol === col.status && 'ring-2 ring-primary ring-offset-2'
              )}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', getStatusInfo(col.status).color)} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="text-xs text-muted-foreground">{colTasks.length}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => openCreateInColumn(col.status)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2 px-2 pb-3">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-xs text-muted-foreground">No tasks</p>
                    <button
                      onClick={() => openCreateInColumn(col.status)}
                      className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      Add task
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      isDragging={draggingId === task.id}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onClick={() => handleTaskClick(task.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No tasks match your filters.
        </div>
      )}

      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        projectId={projectId}
        members={members}
        labels={labels}
        defaultStatus={createStatus}
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
        projectTasks={displayTasks}
        workspaceId={workspaceId}
        projectId={projectId}
        currentUserId={currentUserId}
      />
    </div>
  );
}

function KanbanCard({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  task: TaskWithDetails;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const priorityInfo = getPriorityInfo(task.priority);
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'done';
  const isDueToday = dueDate && isToday(dueDate);
  const assigneeName = task.assignee_name || task.assignee_email?.split('@')[0] || null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-md border border-border bg-background p-3 shadow-sm transition-all hover:shadow-md hover:border-foreground/20',
        isDragging && 'opacity-50 rotate-2'
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
        <span className={cn(
          'flex-1 text-sm font-medium leading-snug',
          task.status === 'done' && 'text-muted-foreground line-through'
        )}>
          {task.title}
        </span>
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 pl-5">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-xs text-muted-foreground">+{task.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer metadata */}
      <div className="mt-2.5 flex items-center justify-between pl-5">
        <div className="flex items-center gap-2">
          {task.priority !== 'none' && (
            <span className={cn('flex items-center gap-1 text-xs font-medium', priorityInfo.color)}>
              <span className={cn('h-2 w-2 rounded-full', priorityInfo.dot)} />
              {priorityInfo.label}
            </span>
          )}
          {task.subtask_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {task.subtask_done_count}/{task.subtask_count}
            </span>
          )}
          {dueDate && (
            <span className={cn(
              'text-xs',
              isOverdue ? 'text-red-600 font-medium' : isDueToday ? 'text-orange-600 font-medium' : 'text-muted-foreground'
            )}>
              {format(dueDate, 'MMM d')}
            </span>
          )}
        </div>
        {assigneeName && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {assigneeName[0]?.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
