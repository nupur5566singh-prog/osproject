export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type SprintStatus = 'planned' | 'active' | 'completed';

export interface Task {
  id: string;
  workspace_id: string;
  project_id: string;
  parent_task_id: string | null;
  sprint_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number | null;
  assignee_id: string | null;
  created_by: string;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SprintWithStats extends Sprint {
  total_tasks: number;
  completed_tasks: number;
  remaining_tasks: number;
}

export interface TaskWithDetails extends Task {
  assignee_name: string | null;
  assignee_email: string | null;
  creator_name: string | null;
  subtask_count: number;
  subtask_done_count: number;
  labels: TaskLabelInfo[];
}

export interface TaskLabelInfo {
  id: string;
  name: string;
  color: string;
}

export interface Subtask extends Task {
  assignee_name: string | null;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CommentWithUser extends Comment {
  author_name: string | null;
  author_email: string | null;
}

export interface Label {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

export interface TaskDependencyWithTask extends TaskDependency {
  depends_on_title: string;
  depends_on_status: TaskStatus;
}

export interface ProjectMemberInfo {
  id: string;
  user_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
}

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-slate-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string; dot: string }[] = [
  { value: 'none', label: 'None', color: 'text-muted-foreground', dot: 'bg-slate-300' },
  { value: 'low', label: 'Low', color: 'text-blue-600', dot: 'bg-blue-400' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600', dot: 'bg-amber-400' },
  { value: 'high', label: 'High', color: 'text-orange-600', dot: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600', dot: 'bg-red-500' },
];

export const LABEL_COLORS = [
  { name: 'slate', value: '#64748b' },
  { name: 'blue', value: '#3b82f6' },
  { name: 'green', value: '#22c55e' },
  { name: 'amber', value: '#f59e0b' },
  { name: 'red', value: '#ef4444' },
  { name: 'purple', value: '#a855f7' },
  { name: 'pink', value: '#ec4899' },
  { name: 'teal', value: '#14b8a6' },
];

export function getStatusInfo(status: TaskStatus) {
  return TASK_STATUSES.find((s) => s.value === status) ?? TASK_STATUSES[0];
}

export function getPriorityInfo(priority: TaskPriority) {
  return TASK_PRIORITIES.find((p) => p.value === priority) ?? TASK_PRIORITIES[0];
}

export const SPRINT_STATUSES: { value: SprintStatus; label: string; color: string; badge: string }[] = [
  { value: 'planned', label: 'Planned', color: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' },
  { value: 'active', label: 'Active', color: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'text-green-600', badge: 'bg-green-100 text-green-700' },
];

export function getSprintStatusInfo(status: SprintStatus) {
  return SPRINT_STATUSES.find((s) => s.value === status) ?? SPRINT_STATUSES[0];
}
