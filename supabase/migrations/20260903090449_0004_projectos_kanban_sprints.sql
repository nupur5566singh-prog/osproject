/*
# ProjectOS Phase 3+4: Kanban Board + Backlog/Sprints

- Adds `position` (double precision) to tasks for stable drag-and-drop ordering
- Creates `sprints` table with planned/active/completed statuses
- Adds `sprint_id` to tasks for sprint/backlog assignment
- RLS on sprints using existing workspace_members model
- Backlog = tasks where sprint_id IS NULL
*/

-- ============================================================
-- Add position column to tasks (for drag-and-drop ordering)
-- ============================================================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS position double precision DEFAULT 1000;

CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(position);

-- ============================================================
-- SPRINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON public.sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_workspace_id ON public.sprints(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sprints_status ON public.sprints(status);

-- Only one active sprint per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_sprints_one_active_per_project
  ON public.sprints(project_id) WHERE status = 'active';

-- updated_at trigger (reuse existing function)
DROP TRIGGER IF EXISTS sprints_updated_at ON public.sprints;
CREATE TRIGGER sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Add sprint_id FK to tasks (after sprints table exists)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON public.tasks(sprint_id);

-- ============================================================
-- RLS POLICIES FOR SPRINTS
-- ============================================================

DROP POLICY IF EXISTS "select_member_sprints" ON public.sprints;
CREATE POLICY "select_member_sprints" ON public.sprints
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = sprints.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_member_sprints" ON public.sprints;
CREATE POLICY "insert_member_sprints" ON public.sprints
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = sprints.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_member_sprints" ON public.sprints;
CREATE POLICY "update_member_sprints" ON public.sprints
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = sprints.workspace_id AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = sprints.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_member_sprints" ON public.sprints;
CREATE POLICY "delete_member_sprints" ON public.sprints
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = sprints.workspace_id AND wm.user_id = auth.uid()
    )
  );