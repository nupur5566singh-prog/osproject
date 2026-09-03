'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { projectSchema } from '@/lib/validation/schemas';
import { ArrowLeft, Code2, LayoutGrid, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const PROJECT_TYPES = [
  {
    value: 'general' as const,
    label: 'General',
    description: 'For any type of project — marketing, operations, planning, and more.',
    icon: LayoutGrid,
  },
  {
    value: 'software' as const,
    label: 'Software Development',
    description: 'For software teams — includes backlog, sprints, and issue tracking.',
    icon: Code2,
  },
];

export default function NewProjectPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<'general' | 'software'>('general');
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    project_type?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const values = { name, description, project_type: projectType };
    const result = projectSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof typeof fieldErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to create a project');
        router.push('/login');
        return;
      }

      const { data: project, error: projError } = await supabase
        .from('projects')
        .insert({
          workspace_id: params.workspaceId,
          name: name.trim(),
          description: description.trim() || null,
          project_type: projectType,
          created_by: user.id,
        })
        .select()
        .single();

      if (projError || !project) {
        toast.error('Failed to create project. Please try again.');
        return;
      }

      await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
      });

      toast.success('Project created successfully!');
      router.push(`/app/workspaces/${params.workspaceId}/projects/${project.id}`);
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href={`/app/workspaces/${params.workspaceId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to workspace
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create a project</CardTitle>
          <CardDescription>
            Projects organize your work into focused areas with their own tasks, boards, and sprints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Website Redesign, Mobile App, Q4 Launch"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe what this project is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Project type</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PROJECT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setProjectType(type.value)}
                    disabled={loading}
                    className={cn(
                      'relative rounded-lg border-2 p-4 text-left transition-all',
                      projectType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    {projectType === type.value && (
                      <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'mb-2 flex h-9 w-9 items-center justify-center rounded-lg',
                        projectType === type.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      <type.icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium">{type.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
              {errors.project_type && (
                <p className="text-xs text-destructive">{errors.project_type}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create project'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
