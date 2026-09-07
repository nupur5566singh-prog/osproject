import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getWorkspaceById } from '@/lib/queries/workspace';
import { getWorkspaceMembers, getMemberTaskCounts } from '@/lib/queries/team';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

export default async function TeamPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const workspace = await getWorkspaceById(params.workspaceId);
  if (!workspace) notFound();

  const members = await getWorkspaceMembers(workspace.id);
  const taskCounts = await getMemberTaskCounts(workspace.id);

  return (
    <div className="space-y-6">
      <Link
        href={`/app/workspaces/${workspace.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {workspace.name}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-6 w-6 text-primary" />
            Team
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? 'member' : 'members'} in {workspace.name}
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium">No team members yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Invite people to collaborate in this workspace.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-4 rounded-lg border border-border p-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {(m.full_name ?? m.email ?? '?')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{m.full_name ?? 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">{m.email}</div>
                  </div>
                  <Badge
                    variant={m.role === 'owner' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {m.role}
                  </Badge>
                  <div className="text-right">
                    <div className="text-lg font-bold">{taskCounts[m.user_id] ?? 0}</div>
                    <div className="text-xs text-muted-foreground">tasks</div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-xs text-muted-foreground">Joined</div>
                    <div className="text-sm font-medium">{format(new Date(m.created_at), 'MMM yyyy')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite by email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Email invitations are not yet configured. To enable member invitations, connect an email provider
            (such as Resend, SendGrid, or Supabase Auth Email) to your project.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
