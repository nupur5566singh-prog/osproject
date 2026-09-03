'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label as UILabel } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trash2,
  Plus,
  X,
  Link2,
  MessageSquare,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
  TaskWithDetails,
  Subtask,
  CommentWithUser,
  Label as LabelType,
  TaskDependencyWithTask,
  ProjectMemberInfo,
  TaskStatus,
  TaskPriority,
  TASK_STATUSES,
  TASK_PRIORITIES,
  getStatusInfo,
  getPriorityInfo,
} from '@/lib/types/tasks';
import {
  updateTask,
  deleteTask,
  createComment,
  deleteComment,
  createLabel,
  addLabelToTask,
  removeLabelFromTask,
  addTaskDependency,
  removeTaskDependency,
  createTask,
} from '@/lib/mutations/tasks';
import { TaskCreateDialog } from '@/components/tasks/task-create-dialog';

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithDetails | null;
  subtasks: Subtask[];
  comments: CommentWithUser[];
  labels: LabelType[];
  taskLabels: { id: string; name: string; color: string }[];
  dependencies: TaskDependencyWithTask[];
  members: ProjectMemberInfo[];
  projectTasks: TaskWithDetails[];
  workspaceId: string;
  projectId: string;
  currentUserId: string;
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  subtasks,
  comments,
  labels,
  taskLabels,
  dependencies,
  members,
  projectTasks,
  workspaceId,
  projectId,
  currentUserId,
}: TaskDetailDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [assigneeId, setAssigneeId] = useState<string>('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showSubtaskDialog, setShowSubtaskDialog] = useState(false);
  const [showLabelCreate, setShowLabelCreate] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
  const [depTaskId, setDepTaskId] = useState('');
  const [saving, setSaving] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [depLoading, setDepLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee_id || 'unassigned');
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setStartDate(task.start_date ? task.start_date.split('T')[0] : '');
    }
  }, [task]);

  const handleSaveField = useCallback(async (field: string, value: string | null) => {
    if (!task) return;
    setSaving(true);
    try {
      const updates: Record<string, string | null | undefined> = { [field]: value };
      if (field === 'assignee_id' && value === 'unassigned') {
        updates[field] = null;
      }
      if (field === 'due_date' || field === 'start_date') {
        updates[field] = value ? new Date(value).toISOString() : null;
      }
      await updateTask(task.id, updates as Parameters<typeof updateTask>[1]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }, [task, router]);

  const handleTitleBlur = () => {
    if (task && title !== task.title && title.trim()) {
      handleSaveField('title', title.trim());
    }
  };

  const handleDescBlur = () => {
    if (task && description !== (task.description || '')) {
      handleSaveField('description', description.trim() || null);
    }
  };

  const handleStatusChange = (v: string) => {
    setStatus(v as TaskStatus);
    handleSaveField('status', v);
  };

  const handlePriorityChange = (v: string) => {
    setPriority(v as TaskPriority);
    handleSaveField('priority', v);
  };

  const handleAssigneeChange = (v: string) => {
    setAssigneeId(v);
    handleSaveField('assignee_id', v);
  };

  const handleDueDateChange = (v: string) => {
    setDueDate(v);
    handleSaveField('due_date', v || null);
  };

  const handleStartDateChange = (v: string) => {
    setStartDate(v);
    handleSaveField('start_date', v || null);
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      await deleteTask(task.id);
      toast.success('Task deleted');
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleAddComment = async () => {
    if (!task || !commentText.trim()) return;
    setCommentLoading(true);
    try {
      await createComment(task.id, commentText.trim());
      setCommentText('');
      toast.success('Comment added');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  const handleToggleLabel = async (labelId: string, isAssigned: boolean) => {
    if (!task) return;
    try {
      if (isAssigned) {
        await removeLabelFromTask(task.id, labelId);
      } else {
        await addLabelToTask(task.id, labelId);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update labels');
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    setLabelLoading(true);
    try {
      const label = await createLabel(workspaceId, newLabelName.trim(), newLabelColor);
      if (task) {
        await addLabelToTask(task.id, label.id);
      }
      setNewLabelName('');
      setShowLabelCreate(false);
      toast.success('Label created');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create label');
    } finally {
      setLabelLoading(false);
    }
  };

  const handleAddDependency = async () => {
    if (!task || !depTaskId) return;
    setDepLoading(true);
    try {
      await addTaskDependency(task.id, depTaskId);
      setDepTaskId('');
      toast.success('Dependency added');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add dependency');
    } finally {
      setDepLoading(false);
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      await removeTaskDependency(depId);
      toast.success('Dependency removed');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove dependency');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteTask(subtaskId);
      toast.success('Subtask deleted');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete subtask');
    }
  };

  const handleToggleSubtaskStatus = async (subtask: Subtask) => {
    const newStatus: TaskStatus = subtask.status === 'done' ? 'todo' : 'done';
    try {
      await updateTask(subtask.id, { status: newStatus });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update subtask');
    }
  };

  if (!task) return null;

  const availableDepTasks = projectTasks.filter(
    (t) => t.id !== task.id && !dependencies.some((d) => d.depends_on_task_id === t.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="border-none px-0 text-lg font-semibold focus-visible:ring-0"
                  disabled={saving}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={handleDelete} className="shrink-0 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            {/* Description */}
            <div className="space-y-1.5">
              <UILabel className="text-xs font-medium text-muted-foreground">Description</UILabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
                placeholder="Add a description..."
                rows={3}
                disabled={saving}
              />
            </div>

            {/* Properties grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <UILabel className="text-xs font-medium text-muted-foreground">Status</UILabel>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', s.color)} />
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <UILabel className="text-xs font-medium text-muted-foreground">Priority</UILabel>
                <Select value={priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', p.dot)} />
                          {p.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <UILabel className="text-xs font-medium text-muted-foreground">Assignee</UILabel>
                <Select value={assigneeId} onValueChange={handleAssigneeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.full_name || m.email || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <UILabel className="text-xs font-medium text-muted-foreground">Due date</UILabel>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-1.5">
                <UILabel className="text-xs font-medium text-muted-foreground">Start date</UILabel>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Labels */}
            <div className="space-y-1.5">
              <UILabel className="text-xs font-medium text-muted-foreground">Labels</UILabel>
              <div className="flex flex-wrap items-center gap-2">
                {taskLabels.map((label) => (
                  <span
                    key={label.id}
                    className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                    <button onClick={() => handleToggleLabel(label.id, true)} className="hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {labels.filter((l) => !taskLabels.some((tl) => tl.id === l.id)).map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleToggleLabel(label.id, false)}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground hover:border-foreground/20"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                    {label.name}
                  </button>
                ))}
                {showLabelCreate ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="Label name"
                      className="h-7 w-24 text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateLabel())}
                    />
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="h-7 w-7 cursor-pointer rounded border border-border"
                    />
                    <Button size="sm" onClick={handleCreateLabel} disabled={labelLoading || !newLabelName.trim()}>
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowLabelCreate(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLabelCreate(true)}
                    className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-foreground/20"
                  >
                    <Plus className="h-3 w-3" />
                    New label
                  </button>
                )}
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <UILabel className="text-xs font-medium text-muted-foreground">
                  Subtasks {subtasks.length > 0 && `(${subtasks.filter(s => s.status === 'done').length}/${subtasks.length})`}
                </UILabel>
                <Button size="sm" variant="ghost" onClick={() => setShowSubtaskDialog(true)} className="h-7 text-xs">
                  <Plus className="mr-1 h-3 w-3" />
                  Add subtask
                </Button>
              </div>
              {subtasks.length > 0 ? (
                <div className="space-y-1">
                  {subtasks.map((subtask) => {
                    const statusInfo = getStatusInfo(subtask.status);
                    return (
                      <div key={subtask.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50">
                        <button onClick={() => handleToggleSubtaskStatus(subtask)}>
                          {subtask.status === 'done' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className={cn('h-4 w-4', statusInfo.color)} />
                          )}
                        </button>
                        <span className={cn('flex-1 text-sm', subtask.status === 'done' && 'text-muted-foreground line-through')}>
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50">No subtasks yet</p>
              )}
            </div>

            {/* Dependencies */}
            <div className="space-y-2">
              <UILabel className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Link2 className="h-3 w-3" />
                Dependencies
              </UILabel>
              {dependencies.length > 0 && (
                <div className="space-y-1">
                  {dependencies.map((dep) => (
                    <div key={dep.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 text-sm">
                        Depends on <span className="font-medium">{dep.depends_on_title}</span>
                      </span>
                      <span className={cn('text-xs', getStatusInfo(dep.depends_on_status).color)}>
                        {getStatusInfo(dep.depends_on_status).label}
                      </span>
                      <button
                        onClick={() => handleRemoveDependency(dep.id)}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {availableDepTasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select value={depTaskId} onValueChange={setDepTaskId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select a task..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepTasks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddDependency} disabled={depLoading || !depTaskId} className="h-8">
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="space-y-2 border-t border-border pt-4">
              <UILabel className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Comments ({comments.length})
              </UILabel>
              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                          {(comment.author_name || comment.author_email || 'U')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {comment.author_name || comment.author_email?.split('@')[0] || 'Unknown'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            {comment.user_id === currentUserId && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={commentLoading || !commentText.trim()}
                  className="shrink-0"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TaskCreateDialog
        open={showSubtaskDialog}
        onOpenChange={setShowSubtaskDialog}
        workspaceId={workspaceId}
        projectId={projectId}
        members={members}
        labels={labels}
        parentTaskId={task.id}
      />
    </>
  );
}
