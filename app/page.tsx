import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import {
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  ListTodo,
  KanbanSquare,
  Zap,
  BarChart3,
  Users,
  Layers,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#workflow" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="#preview" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Preview
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-muted-foreground animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              The project management platform for teams that ship
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up">
              Manage projects with{' '}
              <span className="text-primary">clarity and speed</span>
            </h1>
            <p className="mt-6 text-balance text-lg text-muted-foreground sm:text-xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              ProjectOS brings tasks, boards, sprints, and dashboards together in one
              unified workspace. Plan less, ship more.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. Free for small teams.
            </p>
          </div>
        </div>

        {/* Decorative grid background */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent)',
          }}
        />
      </section>

      {/* Product Preview / Mock Dashboard */}
      <section id="preview" className="border-t border-border/60 bg-secondary/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your team needs, in one place
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              A workspace designed for focus and collaboration
            </p>
          </div>

          {/* Mock dashboard */}
          <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-foreground/5">
            {/* Mock top bar */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="ml-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-medium">Acme Inc.</span>
              </div>
            </div>

            {/* Mock content */}
            <div className="flex">
              {/* Mock sidebar */}
              <div className="hidden w-44 shrink-0 border-r border-border bg-sidebar p-3 sm:block">
                <div className="space-y-1">
                  {['Home', 'My Tasks', 'Projects', 'Notifications', 'Settings'].map((item, i) => (
                    <div
                      key={item}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-xs ${
                        i === 2 ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/70'
                      }`}
                    >
                      <div className="h-3.5 w-3.5 rounded-sm bg-current opacity-50" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock main area */}
              <div className="flex-1 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="h-5 w-32 rounded bg-foreground/10" />
                    <div className="mt-2 h-3 w-48 rounded bg-foreground/5" />
                  </div>
                  <div className="h-8 w-24 rounded-md bg-primary" />
                </div>

                {/* Mock project cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {['Website Redesign', 'Mobile App', 'API Platform'].map((name, i) => (
                    <div key={name} className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="h-4 w-6 rounded bg-primary/20" />
                        <div className="h-2 w-12 rounded-full bg-foreground/10" />
                      </div>
                      <div className="text-sm font-medium">{name}</div>
                      <div className="mt-2 h-2 w-20 rounded bg-foreground/5" />
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[0, 1].map((j) => (
                            <div key={j} className="h-6 w-6 rounded-full border-2 border-card bg-secondary" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{3 + i} members</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock chart bar */}
                <div className="mt-6 rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 text-xs font-medium text-muted-foreground">Weekly Progress</div>
                  <div className="flex items-end gap-2">
                    {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                      <div key={i} className="flex-1">
                        <div
                          className="rounded-t bg-primary/20"
                          style={{ height: `${h}px` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for the way teams actually work
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              From planning to delivery, ProjectOS has you covered
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: LayoutGrid,
                title: 'Projects & Workspaces',
                description: 'Organize work into workspaces and projects. Invite your team and start collaborating in minutes.',
              },
              {
                icon: ListTodo,
                title: 'Task Management',
                description: 'Create tasks, subtasks, and assign them to team members. Track progress with due dates and priorities.',
              },
              {
                icon: KanbanSquare,
                title: 'Kanban Boards',
                description: 'Visualize your work with drag-and-drop boards. Move tasks across columns and see status at a glance.',
              },
              {
                icon: Zap,
                title: 'Sprints & Backlogs',
                description: 'Plan sprints, manage backlogs, and track velocity. Built for agile teams that iterate fast.',
              },
              {
                icon: BarChart3,
                title: 'Dashboards',
                description: 'Get a bird\u2019s-eye view of your projects. Track progress, spot blockers, and make data-driven decisions.',
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Mention teammates, share updates, and keep everyone in sync. Activity logs ensure nothing falls through cracks.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-foreground/5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-t border-border/60 bg-secondary/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From idea to delivery in four steps
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '01', title: 'Create a workspace', description: 'Set up your team workspace and invite members.' },
              { step: '02', title: 'Add projects', description: 'Create projects for each initiative or product.' },
              { step: '03', title: 'Break down work', description: 'Create tasks, assign them, and organize into boards.' },
              { step: '04', title: 'Track & ship', description: 'Monitor progress on dashboards and deliver on time.' },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 3 && (
                  <div className="absolute left-full top-8 hidden h-px w-8 bg-border lg:block" style={{ left: 'calc(100% - 0px)' }} />
                )}
                <div className="text-sm font-bold text-primary">{item.step}</div>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-blue-600 px-8 py-14 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to transform how your team works?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-100">
              Join teams using ProjectOS to plan, track, and ship their best work.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" variant="secondary">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-blue-100">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Free for small teams
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> No credit card required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Logo />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ProjectOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
