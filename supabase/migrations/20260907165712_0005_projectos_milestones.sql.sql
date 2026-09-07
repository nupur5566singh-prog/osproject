/*
# ProjectOS Phase 5: Milestones

- Creates `milestones` table
- RLS using existing workspace_members model
- Indexes on workspace_id, project_id, due_date
*/

CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_milestones_workspace_id ON public.milestones(workspace_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON public.milestones(due_date);

DROP TRIGGER IF EXISTS milestones_updated_at ON public.milestones;
CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP POLICY IF EXISTS "select_member_milestones" ON public.milestones;
CREATE POLICY "select_member_milestones" ON public.milestones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = milestones.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_member_milestones" ON public.milestones;
CREATE POLICY "insert_member_milestones" ON public.milestones
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = milestones.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_member_milestones" ON public.milestones;
CREATE POLICY "update_member_milestones" ON public.milestones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = milestones.workspace_id AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = milestones.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_member_milestones" ON public.milestones;
CREATE POLICY "delete_member_milestones" ON public.milestones
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = milestones.workspace_id AND wm.user_id = auth.uid()
    )
  );
