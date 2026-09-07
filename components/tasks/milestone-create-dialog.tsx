'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label as UILabel } from '@/components/ui/label';
import { toast } from 'sonner';
import { Milestone } from '@/lib/types/tasks';
import { createMilestone } from '@/lib/mutations/milestones';

interface MilestoneCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  projectId: string;
  onCreated?: (milestone: Milestone) => void;
  isDemo?: boolean;
}

export function MilestoneCreateDialog({
  open,
  onOpenChange,
  workspaceId,
  projectId,
  onCreated,
  isDemo,
}: MilestoneCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setDueDate('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dueDate) return;

    setSaving(true);
    try {
      if (isDemo) {
        const ms: Milestone = {
          id: crypto.randomUUID(),
          workspace_id: workspaceId,
          project_id: projectId,
          name: name.trim(),
          description: description.trim() || null,
          due_date: new Date(dueDate).toISOString(),
          created_by: 'demo-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        onCreated?.(ms);
        toast.success('Milestone created');
        onOpenChange(false);
      } else {
        const data = await createMilestone({
          workspace_id: workspaceId,
          project_id: projectId,
          name,
          description: description || null,
          due_date: dueDate,
        });
        onCreated?.(data as unknown as Milestone);
        toast.success('Milestone created');
        onOpenChange(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create milestone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Milestone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <UILabel htmlFor="ms-name">Name</UILabel>
            <Input
              id="ms-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MVP Launch"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <UILabel htmlFor="ms-desc">Description (optional)</UILabel>
            <Textarea
              id="ms-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the milestone..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <UILabel htmlFor="ms-date">Due Date</UILabel>
            <Input
              id="ms-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !dueDate}>
              {saving ? 'Creating...' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
