'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label as UILabel } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Play, CheckCircle2, Trash2, Target, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  SprintWithStats,
  TaskWithDetails,
  ProjectMemberInfo,
  Label as LabelType,
  SprintStatus,
  getSprintStatusInfo,
} from '@/lib/types/tasks';
import {
  startSprint,
  completeSprint,
  deleteSprint,
} from '@/lib/mutations/sprints';
import { SprintCreateDialog } from '@/components/tasks/sprint-create-dialog';
import { KanbanBoard } from '@/components/tasks/kanban-board';

interface SprintsViewProps {
  sprints: SprintWithStats[];
  tasks: TaskWithDetails[];
  members: ProjectMemberInfo[];
  labels: LabelType[];
  workspaceId: string;
  projectId: string;
  currentUserId: string;
}

export function SprintsView({
  sprints,
  tasks,
  members,
  labels,
  workspaceId,
  projectId,
  currentUserId,
}: SprintsViewProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailSprint, setDetailSprint] = useState<SprintWithStats | null>(null);
  const [completeDialog, setCompleteDialog] = useState<SprintWithStats | null>(null);
  const [incompleteAction, setIncompleteAction] = useState<'backlog' | 'keep'>('backlog');

  const activeSprint = sprints.find((s) => s.status === 'active') ?? null;
  const plannedSprints = sprints.filter((s) => s.status === 'planned');
  const completedSprints = sprints.filter((s) => s.status === 'completed');

  const handleStartSprint = async (sprintId: string) => {
    try {
      await startSprint(sprintId);
      toast.success('Sprint started');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start sprint');
    }
  };

  const handleCompleteSprint = async () => {
    if (!completeDialog) return;
    try {
      await completeSprint(completeDialog.id, incompleteAction);
      toast.success('Sprint completed');
      setCompleteDialog(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete sprint');
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!confirm('Delete this sprint? Tasks will be moved to the backlog.')) return;
    try {
      await deleteSprint(sprintId);
      toast.success('Sprint deleted');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete sprint');
    }
  };

  const sprintTasks = (sprintId: string) => tasks.filter((t) => t.sprint_id === sprintId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {sprints.length} {sprints.length === 1 ? 'sprint' : 'sprints'}
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Sprint
        </Button>
      </div>

      {/* Active sprint with Kanban board */}
      {activeSprint && (
        <div className="space-y-3">
          <SprintCard
            sprint={activeSprint}
            tasks={sprintTasks(activeSprint.id)}
            onStart={() => handleStartSprint(activeSprint.id)}
            onComplete={() => setCompleteDialog(activeSprint)}
            onDelete={() => handleDeleteSprint(activeSprint.id)}
            onOpenDetail={() => setDetailSprint(activeSprint)}
          />
          <div className="rounded-lg border border-border p-4">
            <h4 className="mb-3 text-sm font-semibold">Active sprint board</h4>
            <KanbanBoard
              tasks={tasks}
              members={members}
              labels={labels}
              workspaceId={workspaceId}
              projectId={projectId}
              currentUserId={currentUserId}
              sprintFilter={activeSprint.id}
            />
          </div>
        </div>
      )}

      {/* Planned sprints */}
      {plannedSprints.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Planned</h4>
          {plannedSprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              tasks={sprintTasks(sprint.id)}
              onStart={() => handleStartSprint(sprint.id)}
              onComplete={() => setCompleteDialog(sprint)}
              onDelete={() => handleDeleteSprint(sprint.id)}
              onOpenDetail={() => setDetailSprint(sprint)}
            />
          ))}
        </div>
      )}

      {/* Completed sprints */}
      {completedSprints.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Completed</h4>
          {completedSprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              tasks={sprintTasks(sprint.id)}
              onDelete={() => handleDeleteSprint(sprint.id)}
              onOpenDetail={() => setDetailSprint(sprint)}
            />
          ))}
        </div>
      )}

      {sprints.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">No sprints yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first sprint to start planning your work.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create sprint
          </Button>
        </div>
      )}

      {/* Sprint detail dialog */}
      <Dialog open={!!detailSprint} onOpenChange={(open) => !open && setDetailSprint(null)}>
        <DialogContent className="max-w-lg">
          {detailSprint && (
            <>
              <DialogHeader>
                <DialogTitle>{detailSprint.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {detailSprint.goal && (
                  <div>
                    <UILabel className="text-xs text-muted-foreground">Goal</UILabel>
                    <p className="mt-1 text-sm">{detailSprint.goal}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <div className="text-xl font-bold">{detailSprint.total_tasks}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <div className="text-xl font-bold text-green-600">{detailSprint.completed_tasks}</div>
                    <div className="text-xs text-muted-foreground">Done</div>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <div className="text-xl font-bold text-orange-600">{detailSprint.remaining_tasks}</div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>
                {detailSprint.start_date && detailSprint.end_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(detailSprint.start_date), 'MMM d, yyyy')} – {format(new Date(detailSprint.end_date), 'MMM d, yyyy')}
                  </div>
                )}
                {sprintTasks(detailSprint.id).length > 0 && (
                  <div>
                    <UILabel className="text-xs text-muted-foreground">Tasks</UILabel>
                    <div className="mt-2 space-y-1.5">
                      {sprintTasks(detailSprint.id).map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          <span className={cn('h-2 w-2 rounded-full', task.status === 'done' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400')} />
                          <span className={task.status === 'done' ? 'text-muted-foreground line-through' : ''}>{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete sprint dialog */}
      <AlertDialog open={!!completeDialog} onOpenChange={(open) => !open && setCompleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              {completeDialog && (
                <>
                  {completeDialog.remaining_tasks} incomplete task{completeDialog.remaining_tasks !== 1 ? 's' : ''} will be handled as you choose.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="incomplete"
                value="backlog"
                checked={incompleteAction === 'backlog'}
                onChange={() => setIncompleteAction('backlog')}
              />
              Move incomplete tasks to backlog
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="incomplete"
                value="keep"
                checked={incompleteAction === 'keep'}
                onChange={() => setIncompleteAction('keep')}
              />
              Keep incomplete tasks in this sprint
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteSprint}>Complete sprint</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SprintCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        projectId={projectId}
      />
    </div>
  );
}

function SprintCard({
  sprint,
  tasks,
  onStart,
  onComplete,
  onDelete,
  onOpenDetail,
}: {
  sprint: SprintWithStats;
  tasks: TaskWithDetails[];
  onStart?: () => void;
  onComplete?: () => void;
  onDelete: () => void;
  onOpenDetail: () => void;
}) {
  const statusInfo = getSprintStatusInfo(sprint.status);
  const progress = sprint.total_tasks > 0 ? Math.round((sprint.completed_tasks / sprint.total_tasks) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <button onClick={onOpenDetail} className="hover:underline">{sprint.name}</button>
              <Badge className={cn('text-xs', statusInfo.badge)}>{statusInfo.label}</Badge>
            </CardTitle>
            {sprint.goal && (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {sprint.goal}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {sprint.status === 'planned' && onStart && (
              <Button variant="outline" size="sm" onClick={onStart}>
                <Play className="mr-1 h-3.5 w-3.5" />
                Start
              </Button>
            )}
            {sprint.status === 'active' && onComplete && (
              <Button variant="outline" size="sm" onClick={onComplete}>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Complete
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {sprint.start_date && sprint.end_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(sprint.start_date), 'MMM d')} – {format(new Date(sprint.end_date), 'MMM d')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {sprint.completed_tasks}/{sprint.total_tasks} completed ({progress}%)
          </span>
        </div>
        {sprint.total_tasks > 0 && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
