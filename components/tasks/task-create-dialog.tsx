'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTask } from '@/lib/mutations/tasks';
import { taskSchema } from '@/lib/validation/task-schemas';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TaskStatus,
  TaskPriority,
  ProjectMemberInfo,
  Label as LabelType,
} from '@/lib/types/tasks';

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  projectId: string;
  members: ProjectMemberInfo[];
  labels: LabelType[];
  parentTaskId?: string | null;
  defaultStatus?: TaskStatus;
  onCreated?: () => void;
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  workspaceId,
  projectId,
  members,
  labels,
  parentTaskId = null,
  defaultStatus = 'todo',
  onCreated,
}: TaskCreateDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [assigneeId, setAssigneeId] = useState<string>('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('none');
      setAssigneeId('unassigned');
      setDueDate('');
      setSelectedLabels([]);
      setError(null);
    }
  }, [open, defaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = taskSchema.safeParse({
      title,
      description,
      status,
      priority,
      assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      parent_task_id: parentTaskId,
    });

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const task = await createTask({
        workspace_id: workspaceId,
        project_id: projectId,
        title,
        description: description || null,
        status,
        priority,
        assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        parent_task_id: parentTaskId,
      });

      for (const labelId of selectedLabels) {
        const { addLabelToTask } = await import('@/lib/mutations/tasks');
        await addLabelToTask(task.id, labelId);
      }

      toast.success(parentTaskId ? 'Subtask created' : 'Task created');
      onOpenChange(false);
      onCreated?.();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{parentTaskId ? 'Create subtask' : 'Create task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${s.color}`} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {labels.length > 0 && (
            <div className="space-y-2">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                      selectedLabels.includes(label.id)
                        ? 'border-transparent text-white'
                        : 'border-border text-muted-foreground hover:border-foreground/20'
                    }`}
                    style={
                      selectedLabels.includes(label.id)
                        ? { backgroundColor: label.color }
                        : undefined
                    }
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: selectedLabels.includes(label.id) ? 'white' : label.color }}
                    />
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
