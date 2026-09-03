import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectById, getWorkspaceById } from '@/lib/queries/workspace';
import {
  getProjectTasks,
  getWorkspaceLabels,
  getProjectMembers,
  getProjectTaskStats,
} from '@/lib/queries/tasks';
import { getProjectSprints, getActiveSprint, getProjectOverdueTasks } from '@/lib/queries/sprints';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ComingSoon } from '@/components/shared/coming-soon';
import { TaskBoard } from '@/components/tasks/task-board';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { BacklogView } from '@/components/tasks/backlog-view';
import { SprintsView } from '@/components/tasks/sprints-view';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowLeft,
  Settings,
  Code2,
  LayoutGrid,
  Calendar,
  FolderKanban,
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Rocket,
} from 'lucide-react';
import { getSprintStatusInfo } from '@/lib/types/tasks';
import { cn } from '@/lib/utils';

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

  const tasks = await getProjectTasks(project.id);
  const labels = await getWorkspaceLabels(workspace.id);
  const members = await getProjectMembers(project.id);
  const stats = await getProjectTaskStats(project.id);
  const overdueCount = await getProjectOverdueTasks(project.id);
  const sprints = await getProjectSprints(project.id);
  const activeSprint = await getActiveSprint(project.id);

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUserId = session?.user.id ?? '';

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

        {/* Overview */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total tasks</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold">{stats.completed}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                  <CircleDot className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold">{stats.remaining}</div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold">{overdueCount}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active sprint card */}
          {activeSprint && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Rocket className="h-4 w-4 text-blue-500" />
                  Active Sprint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{activeSprint.name}</span>
                      <Badge className={cn('text-xs', getSprintStatusInfo('active').badge)}>Active</Badge>
                    </div>
                    {activeSprint.goal && (
                      <p className="mt-1 text-sm text-muted-foreground">{activeSprint.goal}</p>
                    )}
                    {activeSprint.end_date && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ends {format(new Date(activeSprint.end_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {sprints.find((s) => s.id === activeSprint.id)?.completed_tasks ?? 0}
                      <span className="text-base text-muted-foreground">/{sprints.find((s) => s.id === activeSprint.id)?.total_tasks ?? 0}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">tasks done</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{members.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sprints</span>
                <span className="font-medium">{sprints.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>

          {tasks.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Recent tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${
                        task.status === 'done' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      <span className={task.status === 'done' ? 'text-muted-foreground line-through' : ''}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* List */}
        <TabsContent value="list" className="mt-6">
          <TaskBoard
            tasks={tasks}
            members={members}
            labels={labels}
            workspaceId={workspace.id}
            projectId={project.id}
            currentUserId={currentUserId}
          />
        </TabsContent>

        {/* Board — Kanban */}
        <TabsContent value="board" className="mt-6">
          <KanbanBoard
            tasks={tasks}
            members={members}
            labels={labels}
            workspaceId={workspace.id}
            projectId={project.id}
            currentUserId={currentUserId}
          />
        </TabsContent>

        {/* Backlog */}
        <TabsContent value="backlog" className="mt-6">
          <BacklogView
            tasks={tasks}
            sprints={sprints}
            members={members}
            labels={labels}
            workspaceId={workspace.id}
            projectId={project.id}
            currentUserId={currentUserId}
          />
        </TabsContent>

        {/* Sprints */}
        <TabsContent value="sprints" className="mt-6">
          <SprintsView
            sprints={sprints}
            tasks={tasks}
            members={members}
            labels={labels}
            workspaceId={workspace.id}
            projectId={project.id}
            currentUserId={currentUserId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
