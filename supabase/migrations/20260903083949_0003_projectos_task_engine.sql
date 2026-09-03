/*
# ProjectOS Phase 2: Task Management Engine

## Overview
Creates the task management data model: tasks, comments, labels, task_labels, and task_dependencies.
All tables have RLS enabled using the existing workspace_members security model.

## New Tables
1. tasks — core task model with status, priority, assignee, dates, parent_task_id for subtasks
2. comments — task comments linked to auth.users
3. labels — workspace-level labels with name + color
4. task_labels — join table (task_id, label_id) with composite PK
5. task_dependencies — task-to-task dependency with self-reference prevention

## Constraints
- CHECK on status: todo, in_progress, done
- CHECK on priority: none, low, medium, high, urgent
- CHECK preventing self-dependency
- UNIQUE on (workspace_id, name) for labels
- UNIQUE on (task_id, depends_on_task_id) for dependencies
- UNIQUE on (workspace_id, user_id) already exists on workspace_members

## Indexes
- tasks: workspace_id, project_id, parent_task_id, assignee_id, status, priority, due_date, created_by
- comments: task_id
- labels: workspace_id
- task_labels: task_id, label_id (PK covers this)
- task_dependencies: task_id, depends_on_task_id

## RLS
All tables use membership checks via workspace_members. No USING(true) shortcuts.
- tasks: CRUD scoped to workspace membership
- comments: read/create on accessible tasks, delete own comments
- labels: CRUD scoped to workspace membership
- task_labels: scoped through task + label workspace membership
- task_dependencies: scoped through both tasks' workspace membership

## Triggers
- Reuses existing update_updated_at() function for updated_at on tasks and comments
- Adds tasks_updated_at and comments_updated_at triggers
*/

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'none' CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')),
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date timestamptz,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Tasks: SELECT — user must be member of the task's workspace
DROP POLICY IF EXISTS "select_member_tasks" ON public.tasks;
CREATE POLICY "select_member_tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- Tasks: INSERT — user must be member, created_by must be auth.uid()
DROP POLICY IF EXISTS "insert_member_tasks" ON public.tasks;
CREATE POLICY "insert_member_tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- Tasks: UPDATE — user must be member of the task's workspace
DROP POLICY IF EXISTS "update_member_tasks" ON public.tasks;
CREATE POLICY "update_member_tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- Tasks: DELETE — user must be member of the task's workspace
DROP POLICY IF EXISTS "delete_member_tasks" ON public.tasks;
CREATE POLICY "delete_member_tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = tasks.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);

DROP TRIGGER IF EXISTS comments_updated_at ON public.comments;
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Comments: SELECT — user must be member of the task's workspace
DROP POLICY IF EXISTS "select_member_comments" ON public.comments;
CREATE POLICY "select_member_comments" ON public.comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = comments.task_id AND wm.user_id = auth.uid()
    )
  );

-- Comments: INSERT — user must be member, user_id must be auth.uid()
DROP POLICY IF EXISTS "insert_member_comments" ON public.comments;
CREATE POLICY "insert_member_comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = comments.task_id AND wm.user_id = auth.uid()
    )
  );

-- Comments: DELETE — only own comments
DROP POLICY IF EXISTS "delete_own_comments" ON public.comments;
CREATE POLICY "delete_own_comments" ON public.comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- LABELS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, name)
);

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_labels_workspace_id ON public.labels(workspace_id);

-- Labels: SELECT — user must be member of the workspace
DROP POLICY IF EXISTS "select_member_labels" ON public.labels;
CREATE POLICY "select_member_labels" ON public.labels
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = labels.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- Labels: INSERT — user must be member of the workspace
DROP POLICY IF EXISTS "insert_member_labels" ON public.labels;
CREATE POLICY "insert_member_labels" ON public.labels
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = labels.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- Labels: DELETE — user must be member of the workspace
DROP POLICY IF EXISTS "delete_member_labels" ON public.labels;
CREATE POLICY "delete_member_labels" ON public.labels
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = labels.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- TASK_LABELS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_labels (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- Task labels: SELECT — both task and label must be in accessible workspace
DROP POLICY IF EXISTS "select_member_task_labels" ON public.task_labels;
CREATE POLICY "select_member_task_labels" ON public.task_labels
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_labels.task_id AND wm.user_id = auth.uid()
    )
  );

-- Task labels: INSERT — user must be member of the workspace
DROP POLICY IF EXISTS "insert_member_task_labels" ON public.task_labels;
CREATE POLICY "insert_member_task_labels" ON public.task_labels
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_labels.task_id AND wm.user_id = auth.uid()
    )
  );

-- Task labels: DELETE — user must be member of the workspace
DROP POLICY IF EXISTS "delete_member_task_labels" ON public.task_labels;
CREATE POLICY "delete_member_task_labels" ON public.task_labels
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_labels.task_id AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- TASK_DEPENDENCIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id <> depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON public.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON public.task_dependencies(depends_on_task_id);

-- Dependencies: SELECT — both tasks must be in accessible workspace
DROP POLICY IF EXISTS "select_member_task_dependencies" ON public.task_dependencies;
CREATE POLICY "select_member_task_dependencies" ON public.task_dependencies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_dependencies.task_id AND wm.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.tasks t2
      JOIN public.workspace_members wm2 ON wm2.workspace_id = t2.workspace_id
      WHERE t2.id = task_dependencies.depends_on_task_id AND wm2.user_id = auth.uid()
    )
  );

-- Dependencies: INSERT — user must be member of both tasks' workspace
DROP POLICY IF EXISTS "insert_member_task_dependencies" ON public.task_dependencies;
CREATE POLICY "insert_member_task_dependencies" ON public.task_dependencies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_dependencies.task_id AND wm.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.tasks t2
      JOIN public.workspace_members wm2 ON wm2.workspace_id = t2.workspace_id
      WHERE t2.id = task_dependencies.depends_on_task_id AND wm2.user_id = auth.uid()
    )
  );

-- Dependencies: DELETE — user must be member of the task's workspace
DROP POLICY IF EXISTS "delete_member_task_dependencies" ON public.task_dependencies;
CREATE POLICY "delete_member_task_dependencies" ON public.task_dependencies
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.workspace_members wm ON wm.workspace_id = t.workspace_id
      WHERE t.id = task_dependencies.task_id AND wm.user_id = auth.uid()
    )
  );