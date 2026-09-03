'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskList } from '@/components/tasks/task-list';
import { TaskCreateDialog } from '@/components/tasks/task-create-dialog';
import { TaskDetailDialog } from '@/components/tasks/task-detail-dialog';
import {
  TaskWithDetails,
  Subtask,
  CommentWithUser,
  Label as LabelType,
  TaskDependencyWithTask,
  ProjectMemberInfo,
} from '@/lib/types/tasks';
import { createClient } from '@/lib/supabase/client';

interface TaskBoardProps {
  tasks: TaskWithDetails[];
  members: ProjectMemberInfo[];
  labels: LabelType[];
  workspaceId: string;
  projectId: string;
  currentUserId: string;
}

export function TaskBoard({
  tasks: initialTasks,
  members,
  labels: initialLabels,
  workspaceId,
  projectId,
  currentUserId,
}: TaskBoardProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Detail data state
  const [detailSubtasks, setDetailSubtasks] = useState<Subtask[]>([]);
  const [detailComments, setDetailComments] = useState<CommentWithUser[]>([]);
  const [detailLabels, setDetailLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [detailDependencies, setDetailDependencies] = useState<TaskDependencyWithTask[]>([]);

  const selectedTask = initialTasks.find((t) => t.id === selectedTaskId) ?? null;

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
        id: c.id,
        task_id: c.task_id,
        user_id: c.user_id,
        content: c.content,
        created_at: c.created_at,
        updated_at: c.updated_at,
        author_name: c.author?.full_name ?? null,
        author_email: c.author?.email ?? null,
      })) ?? []
    );
    setDetailLabels(
      (labelData as unknown as Array<{ label: { id: string; name: string; color: string } | null }>)
        ?.map((item) => item.label)
        .filter((l): l is { id: string; name: string; color: string } => l !== null) ?? []
    );
    setDetailDependencies(
      (depData as unknown as Array<{
        id: string;
        task_id: string;
        depends_on_task_id: string;
        created_at: string;
        depends_on: { title: string; status: string } | null;
      }>)?.map((d) => ({
        id: d.id,
        task_id: d.task_id,
        depends_on_task_id: d.depends_on_task_id,
        created_at: d.created_at,
        depends_on_title: d.depends_on?.title ?? 'Unknown',
        depends_on_status: (d.depends_on?.status as 'todo' | 'in_progress' | 'done') ?? 'todo',
      })) ?? []
    );
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {initialTasks.length} {initialTasks.length === 1 ? 'task' : 'tasks'}
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Task
        </Button>
      </div>

      {initialTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">No tasks yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first task to start organizing this project.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create task
          </Button>
        </div>
      ) : (
        <TaskList tasks={initialTasks} onTaskClick={handleTaskClick} />
      )}

      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        projectId={projectId}
        members={members}
        labels={initialLabels}
        onCreated={() => router.refresh()}
      />

      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={selectedTask}
        subtasks={detailSubtasks}
        comments={detailComments}
        labels={initialLabels}
        taskLabels={detailLabels}
        dependencies={detailDependencies}
        members={members}
        projectTasks={initialTasks}
        workspaceId={workspaceId}
        projectId={projectId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
