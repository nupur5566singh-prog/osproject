import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getWorkspaceById,
  getWorkspaceProjects,
  getWorkspaceProjectCount,
} from '@/lib/queries/workspace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FolderKanban,
  Calendar,
  Code2,
  LayoutGrid,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const workspace = await getWorkspaceById(params.workspaceId);

  if (!workspace) notFound();

  const projects = await getWorkspaceProjects(workspace.id);
  const projectCount = await getWorkspaceProjectCount(workspace.id);
  const recentProjects = projects.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Here&apos;s what&apos;s happening in your workspace.
          </p>
        </div>
        <Link href={`/app/workspaces/${workspace.id}/projects/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{projectCount}</div>
              <div className="text-sm text-muted-foreground">
                {projectCount === 1 ? 'Project' : 'Projects'}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{recentProjects.filter(p => p.project_type === 'general').length}</div>
              <div className="text-sm text-muted-foreground">General projects</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{recentProjects.filter(p => p.project_type === 'software').length}</div>
              <div className="text-sm text-muted-foreground">Software projects</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent projects</h2>
          {projects.length > 0 && (
            <Link
              href={`/app/workspaces/${workspace.id}/projects`}
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <FolderKanban className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No projects yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create your first project to start organizing tasks, boards, and sprints.
              </p>
              <Link href={`/app/workspaces/${workspace.id}/projects/new`}>
                <Button className="mt-6">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/app/workspaces/${workspace.id}/projects/${project.id}`}
              >
                <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-foreground/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            project.project_type === 'software'
                              ? 'bg-orange-500/10 text-orange-600'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {project.project_type === 'software' ? (
                            <Code2 className="h-4 w-4" />
                          ) : (
                            <LayoutGrid className="h-4 w-4" />
                          )}
                        </div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {project.description || 'No description provided'}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {project.project_type === 'software' ? 'Software' : 'General'}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
