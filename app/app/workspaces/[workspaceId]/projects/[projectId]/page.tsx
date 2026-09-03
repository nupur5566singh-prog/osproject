import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectById, getWorkspaceById } from '@/lib/queries/workspace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ComingSoon } from '@/components/shared/coming-soon';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Settings,
  Code2,
  LayoutGrid,
  Calendar,
  User,
  FolderKanban,
} from 'lucide-react';

export default async function ProjectDetailPage({
  params,
}: {
  params: { workspaceId: string; projectId: string };
}) {
  const project = await getProjectById(params.projectId);

  if (!project) notFound();

  const workspace = await getWorkspaceById(params.workspaceId);
  if (!workspace) notFound();

  const isSoftware = project.project_type === 'software';

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href={`/app/workspaces/${workspace.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {workspace.name}
      </Link>

      {/* Project header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              isSoftware ? 'bg-orange-500/10 text-orange-600' : 'bg-primary/10 text-primary'
            }`}
          >
            {isSoftware ? <Code2 className="h-6 w-6" /> : <LayoutGrid className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {project.description || 'No description provided'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="capitalize">
                {isSoftware ? 'Software Development' : 'General'}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
        </TabsList>

        {/* Overview — functional */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold">0</div>
                  <div className="text-xs text-muted-foreground">Total tasks</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold">0</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold">1</div>
                  <div className="text-xs text-muted-foreground">Member</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Project details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Project name</span>
                <span className="font-medium">{project.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">
                  {isSoftware ? 'Software Development' : 'General'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Workspace</span>
                <span className="font-medium">{workspace.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs — coming soon */}
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardContent>
              <ComingSoon
                feature="List View"
                description="A powerful list view for managing all your tasks in one place — with sorting, filtering, and bulk actions."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="board" className="mt-6">
          <Card>
            <CardContent>
              <ComingSoon
                feature="Kanban Board"
                description="A visual drag-and-drop board for moving tasks across columns and tracking progress at a glance."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backlog" className="mt-6">
          <Card>
            <CardContent>
              <ComingSoon
                feature="Backlog"
                description="Manage your backlog of unassigned tasks and prioritize work before pulling it into sprints."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sprints" className="mt-6">
          <Card>
            <CardContent>
              <ComingSoon
                feature="Sprints"
                description="Plan and track sprints with story points, velocity charts, and sprint goals."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
