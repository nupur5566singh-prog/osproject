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
import { Plus, Search, ArrowRight, ArrowLeft, Trash2, Play, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast } from 'date-fns';
import {
  TaskWithDetails,
  ProjectMemberInfo,
  Label as LabelType,
  SprintWithStats,
  TaskStatus,
  TASK_STATUSES,
  TASK_PRIORITIES,
  getStatusInfo,
  getPriorityInfo,
  getSprintStatusInfo,
} from '@/lib/types/tasks';
import { moveTaskToSprint, startSprint } from '@/lib/mutations/sprints';
import { deleteTask } from '@/lib/mutations/tasks';
import { TaskCreateDialog } from '@/components/tasks/task-create-dialog';
import { SprintCreateDialog } from '@/components/tasks/sprint-create-dialog';
import { TaskDetailDialog } from '@/components/tasks/task-detail-dialog';
import { Subtask, CommentWithUser, TaskDependencyWithTask } from '@/lib/types/tasks';
import { createClient } from '@/lib/supabase/client';

interface BacklogViewProps {
  tasks: TaskWithDetails[];
  sprints: SprintWithStats[];
  members: ProjectMemberInfo[];
  labels: LabelType[];
  workspaceId: string;
  projectId: string;
  currentUserId: string;
}

export function BacklogView({
  tasks,
  sprints,
  members,
  labels,
  workspaceId,
  projectId,
  currentUserId,
}: BacklogViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [sprintCreateOpen, setSprintCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<TaskWithDetails[] | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  // Detail data state
  const [detailSubtasks, setDetailSubtasks] = useState<Subtask[]>([]);
  const [detailComments, setDetailComments] = useState<CommentWithUser[]>([]);
  const [detailLabels, setDetailLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [detailDependencies, setDetailDependencies] = useState<TaskDependencyWithTask[]>([]);

  const displayTasks = optimisticTasks ?? tasks;

  const backlogTasks = useMemo(() => {
    let result = displayTasks.filter((t) => !t.sprint_id);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'me') {
        result = result.filter((t) => t.assignee_id === currentUserId);
      } else if (assigneeFilter === 'unassigned') {
        result = result.filter((t) => !t.assignee_id);
      } else {
        result = result.filter((t) => t.assignee_id === assigneeFilter);
      }
    }
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    return result;
  }, [displayTasks, searchQuery, assigneeFilter, priorityFilter, currentUserId]);

  const sprintTasks = useCallback(
    (sprintId: string) => displayTasks.filter((t) => t.sprint_id === sprintId),
    [displayTasks]
  );

  const handleMoveTask = async (taskId: string, targetSprintId: string | null) => {
    const task = displayTasks.find((t) => t.id === taskId);
    if (!task || task.sprint_id === targetSprintId) return;

    setMovingTaskId(taskId);
    setOptimisticTasks(
      displayTasks.map((t) =>
        t.id === taskId ? { ...t, sprint_id: targetSprintId } : t
      )
    );

    try {
      await moveTaskToSprint(taskId, targetSprintId);
      setOptimisticTasks(null);
      router.refresh();
    } catch (err) {
      setOptimisticTasks(null);
      toast.error(err instanceof Error ? err.message : 'Failed to move task');
    } finally {
      setMovingTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      await startSprint(sprintId);
      toast.success('Sprint started');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start sprint');
    }
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

    setDetailSubtasks(
      (subtaskData as unknown as Array<{ assignee: { full_name: string | null } | null } & Subtask>)?.map((s) => ({ ...s, assignee_name: s.assignee?.full_name ?? null })) ?? []
    );
    setDetailComments(
      (commentData as unknown as Array<{ author: { full_name: string | null; email: string | null } | null } & CommentWithUser>)?.map((c) => ({
        id: c.id, task_id: c.task_id, user_id: c.user_id, content: c.content,
        created_at: c.created_at, updated_at: c.updated_at,
        author_name: c.author?.full_name ?? null, author_email: c.author?.email ?? null,
      })) ?? []
    );
    setDetailLabels(
      (labelData as unknown as Array<{ label: { id: string; name: string; color: string } | null }>)?.map((item) => item.label).filter((l): l is { id: string; name: string; color: string } => l !== null) ?? []
    );
    setDetailDependencies(
      (depData as unknown as Array<{ id: string; task_id: string; depends_on_task_id: string; created_at: string; depends_on: { title: string; status: string } | null }>)?.map((d) => ({
        id: d.id, task_id: d.task_id, depends_on_task_id: d.depends_on_task_id, created_at: d.created_at,
        depends_on_title: d.depends_on?.title ?? 'Unknown', depends_on_status: (d.depends_on?.status as TaskStatus) ?? 'todo',
      })) ?? []
    );
  };

  const selectedTask = displayTasks.find((t) => t.id === selectedTaskId) ?? null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search backlog..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            <SelectItem value="me">Assigned to me</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || m.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {TASK_PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setSprintCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Sprint
        </Button>
      </div>

      {/* Backlog section */}
      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Product Backlog</h3>
            <Badge variant="secondary" className="text-xs">{backlogTasks.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add task
          </Button>
        </div>

        {backlogTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No tasks in backlog</p>
            <button onClick={() => setCreateOpen(true)} className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" /> Create task
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {backlogTasks.map((task) => (
              <BacklogTaskRow
                key={task.id}
                task={task}
                sprints={sprints}
                onClick={() => handleTaskClick(task.id)}
                onMove={(sprintId) => handleMoveTask(task.id, sprintId)}
                onDelete={() => handleDeleteTask(task.id)}
                isMoving={movingTaskId === task.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sprint sections */}
      {sprints.map((sprint) => {
        const sTasks = sprintTasks(sprint.id);
        const statusInfo = getSprintStatusInfo(sprint.status);
        return (
          <div key={sprint.id} className="rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{sprint.name}</h3>
                <Badge className={cn('text-xs', statusInfo.badge)}>{statusInfo.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {sprint.completed_tasks}/{sprint.total_tasks} done
                </span>
              </div>
              <div className="flex items-center gap-2">
                {sprint.status === 'planned' && (
                  <Button variant="outline" size="sm" onClick={() => handleStartSprint(sprint.id)}>
                    <Play className="mr-1 h-3.5 w-3.5" />
                    Start
                  </Button>
                )}
                {sprint.start_date && sprint.end_date && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(sprint.start_date), 'MMM d')} – {format(new Date(sprint.end_date), 'MMM d')}
                  </span>
                )}
              </div>
            </div>

            {sprint.goal && (
              <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
                <span className="font-medium">Goal:</span> {sprint.goal}
              </div>
            )}

            {sTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No tasks in this sprint</div>
            ) : (
              <div className="divide-y divide-border">
                {sTasks.map((task) => (
                  <BacklogTaskRow
                    key={task.id}
                    task={task}
                    sprints={sprints}
                    isInSprint
                    onClick={() => handleTaskClick(task.id)}
                    onMove={(sprintId) => handleMoveTask(task.id, sprintId)}
                    onDelete={() => handleDeleteTask(task.id)}
                    isMoving={movingTaskId === task.id}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        projectId={projectId}
        members={members}
        labels={labels}
        onCreated={() => router.refresh()}
      />

      <SprintCreateDialog
        open={sprintCreateOpen}
        onOpenChange={setSprintCreateOpen}
        workspaceId={workspaceId}
        projectId={projectId}
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

function BacklogTaskRow({
  task,
  sprints,
  isInSprint = false,
  onClick,
  onMove,
  onDelete,
  isMoving,
}: {
  task: TaskWithDetails;
  sprints: SprintWithStats[];
  isInSprint?: boolean;
  onClick: () => void;
  onMove: (sprintId: string | null) => void;
  onDelete: () => void;
  isMoving: boolean;
}) {
  const priorityInfo = getPriorityInfo(task.priority);
  const statusInfo = getStatusInfo(task.status);
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'done';
  const assigneeName = task.assignee_name || task.assignee_email?.split('@')[0] || null;

  return (
    <div className={cn('group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/20', isMoving && 'opacity-50')}>
      <span className={cn('h-2 w-2 shrink-0 rounded-full', statusInfo.color)} />

      <button onClick={onClick} className="min-w-0 flex-1 text-left">
        <span className={cn('block truncate text-sm font-medium', task.status === 'done' && 'text-muted-foreground line-through')}>
          {task.title}
        </span>
      </button>

      {task.priority !== 'none' && (
        <span className={cn('hidden shrink-0 text-xs font-medium sm:block', priorityInfo.color)}>
          {priorityInfo.label}
        </span>
      )}

      {task.labels.length > 0 && (
        <div className="hidden shrink-0 gap-1 sm:flex">
          {task.labels.slice(0, 2).map((label) => (
            <span key={label.id} className="rounded px-1.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: label.color }}>
              {label.name}
            </span>
          ))}
        </div>
      )}

      {dueDate && (
        <span className={cn('hidden shrink-0 text-xs sm:block', isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
          {format(dueDate, 'MMM d')}
        </span>
      )}

      {assigneeName && (
        <div className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary sm:flex">
          {assigneeName[0]?.toUpperCase()}
        </div>
      )}

      {/* Move dropdown */}
      <Select value={task.sprint_id ?? 'backlog'} onValueChange={(v) => onMove(v === 'backlog' ? null : v)}>
        <SelectTrigger className="h-7 w-8 shrink-0 border-none p-0 opacity-0 transition-opacity group-hover:opacity-100" >
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="backlog">Move to backlog</SelectItem>
          {sprints.filter((s) => s.status !== 'completed').map((s) => (
            <SelectItem key={s.id} value={s.id} disabled={s.id === task.sprint_id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        onClick={onDelete}
        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
