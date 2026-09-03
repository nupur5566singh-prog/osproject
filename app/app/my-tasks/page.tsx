import { ComingSoon } from '@/components/shared/coming-soon';
import { ListTodo } from 'lucide-react';

export default function MyTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ListTodo className="h-6 w-6 text-primary" />
          My Tasks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasks assigned to you across all projects and workspaces.
        </p>
      </div>
      <ComingSoon
        feature="My Tasks"
        description="A unified view of all tasks assigned to you across every project and workspace, with filtering by status, priority, and due date."
      />
    </div>
  );
}
