import { TaskWithDetails, SprintWithStats, Milestone, ProjectMemberInfo, Label, Notification, ActivityEventWithUser } from '@/lib/types/tasks';
import { WorkspaceWithRole, Project } from '@/lib/types/database';

export const DEMO_WORKSPACE: WorkspaceWithRole = {
  id: 'demo-ws-001',
  name: 'ProjectOS Demo Workspace',
  slug: 'projectos-demo',
  created_by: 'demo-user-001',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  role: 'owner',
};

export const DEMO_PROJECT: Project = {
  id: 'demo-proj-001',
  workspace_id: 'demo-ws-001',
  name: 'Website Redesign',
  description: 'Complete redesign of the company website with modern UI, authentication, and dashboard.',
  project_type: 'software',
  created_by: 'demo-user-001',
  created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_LABELS: Label[] = [
  { id: 'demo-lbl-1', workspace_id: 'demo-ws-001', name: 'Frontend', color: '#3b82f6', created_at: new Date().toISOString() },
  { id: 'demo-lbl-2', workspace_id: 'demo-ws-001', name: 'Backend', color: '#22c55e', created_at: new Date().toISOString() },
  { id: 'demo-lbl-3', workspace_id: 'demo-ws-001', name: 'Design', color: '#a855f7', created_at: new Date().toISOString() },
  { id: 'demo-lbl-4', workspace_id: 'demo-ws-001', name: 'Bug', color: '#ef4444', created_at: new Date().toISOString() },
  { id: 'demo-lbl-5', workspace_id: 'demo-ws-001', name: 'Testing', color: '#f59e0b', created_at: new Date().toISOString() },
];

export const DEMO_MEMBERS: ProjectMemberInfo[] = [
  { id: 'dm-1', user_id: 'demo-user-001', role: 'owner', full_name: 'Alex Morgan', email: 'alex@projectos.demo' },
  { id: 'dm-2', user_id: 'demo-user-002', role: 'member', full_name: 'Priya Sharma', email: 'priya@projectos.demo' },
  { id: 'dm-3', user_id: 'demo-user-003', role: 'member', full_name: 'Rahul Verma', email: 'rahul@projectos.demo' },
  { id: 'dm-4', user_id: 'demo-user-004', role: 'member', full_name: 'Manju Patel', email: 'manju@projectos.demo' },
];

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export const DEMO_TASKS: TaskWithDetails[] = [
  {
    id: 'demo-task-1', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', parent_task_id: null, sprint_id: 'demo-sprint-1',
    title: 'Design Landing Page', description: 'Create a modern, responsive landing page with hero section, features, and CTA.',
    status: 'done', priority: 'high', position: 100, assignee_id: 'demo-user-003', created_by: 'demo-user-001',
    start_date: daysAgo(20), due_date: daysAgo(14), created_at: daysAgo(25), updated_at: daysAgo(14),
    assignee_name: 'Rahul Verma', assignee_email: 'rahul@projectos.demo', creator_name: 'Alex Morgan',
    subtask_count: 4, subtask_done_count: 4,
    labels: [{ id: 'demo-lbl-3', name: 'Design', color: '#a855f7' }, { id: 'demo-lbl-1', name: 'Frontend', color: '#3b82f6' }],
  },
  {
    id: 'demo-task-2', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', parent_task_id: null, sprint_id: 'demo-sprint-1',
    title: 'Build Authentication', description: 'Implement email/password auth with Supabase, including signup, login, and password reset.',
    status: 'done', priority: 'urgent', position: 200, assignee_id: 'demo-user-002', created_by: 'demo-user-001',
    start_date: daysAgo(18), due_date: daysAgo(10), created_at: daysAgo(24), updated_at: daysAgo(10),
    assignee_name: 'Priya Sharma', assignee_email: 'priya@projectos.demo', creator_name: 'Alex Morgan',
    subtask_count: 5, subtask_done_count: 5,
    labels: [{ id: 'demo-lbl-2', name: 'Backend', color: '#22c55e' }],
  },
  {
    id: 'demo-task-3', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', parent_task_id: null, sprint_id: 'demo-sprint-1',
    title: 'Create Dashboard', description: 'Build the main user dashboard with project cards, stats, and recent activity.',
    status: 'in_progress', priority: 'high', position: 300, assignee_id: 'demo-user-004', created_by: 'demo-user-001',
    start_date: daysAgo(7), due_date: daysFromNow(3), created_at: daysAgo(12), updated_at: daysAgo(2),
    assignee_name: 'Manju Patel', assignee_email: 'manju@projectos.demo', creator_name: 'Alex Morgan',
    subtask_count: 4, subtask_done_count: 2,
    labels: [{ id: 'demo-lbl-1', name: 'Frontend', color: '#3b82f6' }],
  },
  {
    id: 'demo-task-4', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', parent_task_id: null, sprint_id: 'demo-sprint-1',
    title: 'Implement API Endpoints', description: 'Create REST API endpoints for tasks, projects, and workspace management.',
    status: 'in_progress', priority: 'medium', position: 400, assignee_id: 'demo-user-002', created_by: 'demo-user-001',
    start_date: daysAgo(5), due_date: daysFromNow(5), created_at: daysAgo(10), updated_at: daysAgo(1),
    assignee_name: 'Priya Sharma', assignee_email: 'priya@projectos.demo', creator_name: 'Alex Morgan',
    subtask_count: 3, subtask_done_count: 1,
    labels: [{ id: 'demo-lbl-2', name: 'Backend', color: '#22c55e' }],
  },
  {
    id: 'demo-task-5', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', parent_task_id: null, sprint_id: 'demo-sprint-1',
    title: 'Write Integration Tests', description: 'Write comprehensive integration tests for auth, tasks, and API endpoints.',
    status: 'todo', priority: 'medium', position: 500, assignee_id: 'demo-user-003', created_by: 'demo-user-001',
    start_date: daysFromNow(1), due_date: daysFromNow(10), created_at: daysAgo(5), updated_at: daysAgo(5),
    assignee_name: 'Rahul Verma', assignee_email: 'rahul@projectos.demo', creator_name: 'Alex Morgan',
    subtask_count: 2, subtask_done_count: 0,
    labels: [{ id: 'demo-lbl-5', name: 'Testing', color: '#f59e0b' }],
  },
  {
    id: 'demo-task-6', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', parent_task_id: null, sprint_id: null,
    title: 'Deploy Application', description: 'Set up CI/CD pipeline and deploy to Vercel with environment variables.',
    status: 'todo', priority: 'high', position: 600, assignee_id: null, created_by: 'demo-user-001',
    start_date: null, due_date: daysFromNow(14), created_at: daysAgo(3), updated_at: daysAgo(3),
    assignee_name: null, assignee_email: null, creator_name: 'Alex Morgan',
    subtask_count: 0, subtask_done_count: 0,
    labels: [{ id: 'demo-lbl-2', name: 'Backend', color: '#22c55e' }],
  },
  {
    id: 'demo-task-7', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', parent_task_id: null, sprint_id: null,
    title: 'Fix Navigation Overlap on Mobile', description: 'The mobile sidebar overlaps with content on smaller screens.',
    status: 'todo', priority: 'urgent', position: 700, assignee_id: 'demo-user-003', created_by: 'demo-user-002',
    start_date: null, due_date: daysFromNow(2), created_at: daysAgo(2), updated_at: daysAgo(2),
    assignee_name: 'Rahul Verma', assignee_email: 'rahul@projectos.demo', creator_name: 'Priya Sharma',
    subtask_count: 1, subtask_done_count: 0,
    labels: [{ id: 'demo-lbl-4', name: 'Bug', color: '#ef4444' }, { id: 'demo-lbl-1', name: 'Frontend', color: '#3b82f6' }],
  },
  {
    id: 'demo-task-8', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', parent_task_id: null, sprint_id: null,
    title: 'Optimize Image Loading', description: 'Implement lazy loading and image compression for faster page loads.',
    status: 'todo', priority: 'low', position: 800, assignee_id: 'demo-user-004', created_by: 'demo-user-001',
    start_date: null, due_date: daysFromNow(20), created_at: daysAgo(1), updated_at: daysAgo(1),
    assignee_name: 'Manju Patel', assignee_email: 'manju@projectos.demo', creator_name: 'Alex Morgan',
    subtask_count: 0, subtask_done_count: 0,
    labels: [{ id: 'demo-lbl-1', name: 'Frontend', color: '#3b82f6' }],
  },
  {
    id: 'demo-task-9', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', parent_task_id: null, sprint_id: null,
    title: 'User Profile Page', description: 'Create user profile page with avatar, name, and notification preferences.',
    status: 'todo', priority: 'medium', position: 900, assignee_id: null, created_by: 'demo-user-001',
    start_date: null, due_date: null, created_at: daysAgo(1), updated_at: daysAgo(1),
    assignee_name: null, assignee_email: null, creator_name: 'Alex Morgan',
    subtask_count: 0, subtask_done_count: 0,
    labels: [{ id: 'demo-lbl-1', name: 'Frontend', color: '#3b82f6' }, { id: 'demo-lbl-3', name: 'Design', color: '#a855f7' }],
  },
];

export const DEMO_SPRINTS: SprintWithStats[] = [
  {
    id: 'demo-sprint-1', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001',
    name: 'Sprint 01 — Foundation',
    goal: 'Complete authentication, landing page, and dashboard foundation.',
    status: 'active', start_date: daysAgo(14), end_date: daysFromNow(7),
    created_by: 'demo-user-001', created_at: daysAgo(20), updated_at: daysAgo(14),
    total_tasks: 5, completed_tasks: 2, remaining_tasks: 3,
  },
  {
    id: 'demo-sprint-2', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001',
    name: 'Sprint 02 — Polish & Deploy',
    goal: 'Testing, optimization, and production deployment.',
    status: 'planned', start_date: daysFromNow(7), end_date: daysFromNow(21),
    created_by: 'demo-user-001', created_at: daysAgo(5), updated_at: daysAgo(5),
    total_tasks: 0, completed_tasks: 0, remaining_tasks: 0,
  },
];

export const DEMO_MILESTONES: Milestone[] = [
  {
    id: 'demo-ms-1', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001',
    name: 'MVP Launch',
    description: 'Minimum viable product ready for beta testing.',
    due_date: daysFromNow(14),
    created_by: 'demo-user-001', created_at: daysAgo(15), updated_at: daysAgo(15),
  },
  {
    id: 'demo-ms-2', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001',
    name: 'Production Release',
    description: 'Full production deployment with monitoring and CI/CD.',
    due_date: daysFromNow(30),
    created_by: 'demo-user-001', created_at: daysAgo(10), updated_at: daysAgo(10),
  },
];

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-ntf-1', workspace_id: 'demo-ws-001', recipient_id: 'demo-user-001',
    type: 'task_assigned', title: 'Task assigned', message: 'Priya Sharma assigned you to "Implement API Endpoints"',
    task_id: 'demo-task-4', project_id: 'demo-proj-001', comment_id: null,
    read_at: null, created_at: daysAgo(2),
  },
  {
    id: 'demo-ntf-2', workspace_id: 'demo-ws-001', recipient_id: 'demo-user-001',
    type: 'comment_added', title: 'New comment', message: 'Rahul Verma commented on "Create Dashboard"',
    task_id: 'demo-task-3', project_id: 'demo-proj-001', comment_id: null,
    read_at: null, created_at: daysAgo(1),
  },
  {
    id: 'demo-ntf-3', workspace_id: 'demo-ws-001', recipient_id: 'demo-user-001',
    type: 'task_completed', title: 'Task completed', message: 'Rahul Verma completed "Design Landing Page"',
    task_id: 'demo-task-1', project_id: 'demo-proj-001', comment_id: null,
    read_at: daysAgo(14), created_at: daysAgo(14),
  },
  {
    id: 'demo-ntf-4', workspace_id: 'demo-ws-001', recipient_id: 'demo-user-001',
    type: 'sprint_started', title: 'Sprint started', message: 'Sprint 01 — Foundation is now active',
    task_id: null, project_id: 'demo-proj-001', comment_id: null,
    read_at: daysAgo(14), created_at: daysAgo(14),
  },
  {
    id: 'demo-ntf-5', workspace_id: 'demo-ws-001', recipient_id: 'demo-user-001',
    type: 'task_mentioned', title: 'You were mentioned', message: 'Manju Patel mentioned you in a comment on "Create Dashboard"',
    task_id: 'demo-task-3', project_id: 'demo-proj-001', comment_id: null,
    read_at: null, created_at: daysAgo(0),
  },
];

export const DEMO_ACTIVITY: ActivityEventWithUser[] = [
  { id: 'da-1', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', task_id: 'demo-task-1', user_id: 'demo-user-003', event_type: 'task_completed', metadata: { title: 'Design Landing Page' }, created_at: daysAgo(14), user_name: 'Rahul Verma', user_email: 'rahul@projectos.demo' },
  { id: 'da-2', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', task_id: 'demo-task-2', user_id: 'demo-user-002', event_type: 'task_completed', metadata: { title: 'Build Authentication' }, created_at: daysAgo(10), user_name: 'Priya Sharma', user_email: 'priya@projectos.demo' },
  { id: 'da-3', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', task_id: 'demo-task-3', user_id: 'demo-user-001', event_type: 'task_assigned', metadata: { title: 'Create Dashboard', assignee: 'Manju Patel' }, created_at: daysAgo(7), user_name: 'Alex Morgan', user_email: 'alex@projectos.demo' },
  { id: 'da-4', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', task_id: 'demo-task-4', user_id: 'demo-user-001', event_type: 'task_created', metadata: { title: 'Implement API Endpoints' }, created_at: daysAgo(10), user_name: 'Alex Morgan', user_email: 'alex@projectos.demo' },
  { id: 'da-5', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', task_id: 'demo-task-3', user_id: 'demo-user-004', event_type: 'comment_added', metadata: { title: 'Create Dashboard' }, created_at: daysAgo(1), user_name: 'Manju Patel', user_email: 'manju@projectos.demo' },
  { id: 'da-6', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', task_id: null, user_id: 'demo-user-001', event_type: 'sprint_started', metadata: { name: 'Sprint 01 — Foundation' }, created_at: daysAgo(14), user_name: 'Alex Morgan', user_email: 'alex@projectos.demo' },
  { id: 'da-7', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', task_id: 'demo-task-3', user_id: 'demo-user-004', event_type: 'task_status_changed', metadata: { title: 'Create Dashboard', old_status: 'todo', new_status: 'in_progress' }, created_at: daysAgo(5), user_name: 'Manju Patel', user_email: 'manju@projectos.demo' },
  { id: 'da-8', workspace_id: 'demo-ws-001', project_id: 'demo-proj-001', task_id: 'demo-task-4', user_id: 'demo-user-002', event_type: 'task_priority_changed', metadata: { title: 'Implement API Endpoints', old_priority: 'low', new_priority: 'medium' }, created_at: daysAgo(3), user_name: 'Priya Sharma', user_email: 'priya@projectos.demo' },
];

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'alex@projectos.demo',
  full_name: 'Alex Morgan',
};

export function isDevPreviewMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('projectos_demo_mode') === 'true';
}

export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === 'development';
}
