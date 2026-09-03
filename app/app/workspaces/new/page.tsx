'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { workspaceSchema } from '@/lib/validation/schemas';
import { slugify } from '@/lib/utils/slugify';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = workspaceSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to create a workspace');
        router.push('/login');
        return;
      }

      const slug = slugify(name);

      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          slug,
          created_by: user.id,
        })
        .select()
        .single();

      if (wsError || !workspace) {
        if (wsError?.code === '23505') {
          setError('A workspace with this name already exists. Try a different name.');
        } else {
          setError('Failed to create workspace. Please try again.');
        }
        return;
      }

      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        setError('Workspace created, but failed to add you as a member. Please try again.');
        return;
      }

      toast.success('Workspace created successfully!');
      router.push(`/app/workspaces/${workspace.id}`);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/app"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create a workspace</CardTitle>
          <CardDescription>
            A workspace is where your team organizes projects, tasks, and collaborations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Acme Inc, Design Team, Product"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground">
                This is how your workspace will appear across ProjectOS.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create workspace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
