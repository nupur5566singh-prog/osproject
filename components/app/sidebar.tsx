'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  Home,
  ListTodo,
  FolderKanban,
  Bell,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkspaceWithRole } from '@/lib/types/database';

interface SidebarProps {
  workspaces: WorkspaceWithRole[];
  currentWorkspaceId?: string;
}

const NAV_ITEMS = [
  { label: 'Home', href: '/app', icon: Home },
  { label: 'My Tasks', href: '/app/my-tasks', icon: ListTodo },
  { label: 'Projects', href: '/app/projects', icon: FolderKanban },
  { label: 'Notifications', href: '/app/notifications', icon: Bell },
  { label: 'Settings', href: '/app/settings', icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/app'
            ? pathname === '/app'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-white'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function WorkspaceSelector({
  workspaces,
  currentWorkspaceId,
}: {
  workspaces: WorkspaceWithRole[];
  currentWorkspaceId?: string;
}) {
  const router = useRouter();
  const current = workspaces.find((w) => w.id === currentWorkspaceId);

  if (workspaces.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center justify-between gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/60">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              {current?.name?.[0]?.toUpperCase() ?? 'W'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">
                {current?.name ?? 'Select workspace'}
              </div>
              <div className="text-xs text-sidebar-foreground/50">
                {current?.role === 'owner' ? 'Owner' : 'Member'}
              </div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => router.push(`/app/workspaces/${ws.id}`)}
            className={cn(ws.id === currentWorkspaceId && 'bg-secondary')}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
              {ws.name[0]?.toUpperCase()}
            </div>
            <span className="truncate">{ws.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <Link href="/app/workspaces/new">
          <DropdownMenuItem>
            <Plus className="mr-2 h-4 w-4" />
            New workspace
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    router.push('/login');
    router.refresh();
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent/50">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-xs font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-medium text-white">
              {user?.email}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => router.push('/app/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar({ workspaces, currentWorkspaceId }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-3 py-4">
        <Link href="/app" className="inline-block">
          <Logo variant="dark" />
        </Link>
      </div>

      <div className="px-3 pb-3">
        <WorkspaceSelector workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <NavLinks onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="border-t border-sidebar-border p-3">
        <UserMenu />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-sidebar lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 top-3 z-40 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0">
          <SheetHeader className="px-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
