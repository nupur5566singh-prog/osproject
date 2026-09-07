'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast } from 'date-fns';
import { Milestone } from '@/lib/types/tasks';
import { MilestoneCreateDialog } from '@/components/tasks/milestone-create-dialog';
import { updateMilestone, deleteMilestone } from '@/lib/mutations/milestones';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label as UILabel } from '@/components/ui/label';

interface ProjectMilestonesProps {
  milestones: Milestone[];
  workspaceId: string;
  projectId: string;
}

export function ProjectMilestones({ milestones, workspaceId, projectId }: ProjectMilestonesProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Milestone | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (ms: Milestone) => {
    setEditTarget(ms);
    setEditName(ms.name);
    setEditDesc(ms.description ?? '');
    setEditDate(ms.due_date ? ms.due_date.split('T')[0] : '');
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editName.trim() || !editDate) return;
    setSaving(true);
    try {
      await updateMilestone(editTarget.id, {
        name: editName,
        description: editDesc || null,
        due_date: editDate,
      });
      toast.success('Milestone updated');
      setEditTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this milestone?')) return;
    try {
      await deleteMilestone(id);
      toast.success('Milestone deleted');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete milestone');
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="h-4 w-4 text-orange-500" />
            Milestones
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> New Milestone
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Flag className="h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">No milestones yet</p>
            <button onClick={() => setCreateOpen(true)} className="mt-1.5 flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" /> Create milestone
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((ms) => {
              const overdue = isPast(new Date(ms.due_date));
              return (
                <div key={ms.id} className="group flex items-center gap-3 rounded-lg border border-border p-3">
                  <Flag className="h-5 w-5 shrink-0 text-orange-500" />
                  <div className="flex-1">
                    <div className="font-medium">{ms.name}</div>
                    {ms.description && <div className="text-sm text-muted-foreground">{ms.description}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{format(new Date(ms.due_date), 'MMM d, yyyy')}</div>
                    <div className={cn('text-xs', overdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                      {overdue ? 'Overdue' : 'Upcoming'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => handleEdit(ms)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(ms.id)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <MilestoneCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        projectId={projectId}
        onCreated={() => router.refresh()}
      />

      <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <UILabel>Name</UILabel>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <UILabel>Description</UILabel>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <UILabel>Due Date</UILabel>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editName.trim() || !editDate}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
