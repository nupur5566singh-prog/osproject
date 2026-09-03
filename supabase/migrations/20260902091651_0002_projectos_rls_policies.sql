/*
# ProjectOS Foundation Schema — Part 2: RLS Policies

## Overview
Adds Row Level Security policies for all ProjectOS tables.

## Security Model
- profiles: users can read/insert/update only their own profile
- workspaces: users can CRUD workspaces where they are a member (via workspace_members)
- workspace_members: users can read memberships for workspaces they belong to;
  can insert/update/delete only their own membership rows
- projects: users can CRUD projects in workspaces where they are a member
- project_members: users can read memberships for projects in workspaces they belong to;
  can insert/delete their own membership

All policies use auth.uid() for ownership checks. No USING(true) shortcuts.
*/

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- WORKSPACES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_member_workspaces" ON public.workspaces;
CREATE POLICY "select_member_workspaces" ON public.workspaces
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_workspaces" ON public.workspaces;
CREATE POLICY "insert_workspaces" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_member_workspaces" ON public.workspaces;
CREATE POLICY "update_member_workspaces" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_member_workspaces" ON public.workspaces;
CREATE POLICY "delete_member_workspaces" ON public.workspaces
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- WORKSPACE_MEMBERS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_workspace_members" ON public.workspace_members;
CREATE POLICY "select_workspace_members" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT wm2.workspace_id FROM public.workspace_members wm2
      WHERE wm2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_workspace_membership" ON public.workspace_members;
CREATE POLICY "insert_own_workspace_membership" ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_workspace_membership" ON public.workspace_members;
CREATE POLICY "update_own_workspace_membership" ON public.workspace_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workspace_membership" ON public.workspace_members;
CREATE POLICY "delete_own_workspace_membership" ON public.workspace_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- PROJECTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_member_projects" ON public.projects;
CREATE POLICY "select_member_projects" ON public.projects
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = projects.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_member_projects" ON public.projects;
CREATE POLICY "insert_member_projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = projects.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_member_projects" ON public.projects;
CREATE POLICY "update_member_projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = projects.workspace_id AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = projects.workspace_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_member_projects" ON public.projects;
CREATE POLICY "delete_member_projects" ON public.projects
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = projects.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- ============================================================
-- PROJECT_MEMBERS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_project_members" ON public.project_members;
CREATE POLICY "select_project_members" ON public.project_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE p.id = project_members.project_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_project_membership" ON public.project_members;
CREATE POLICY "insert_own_project_membership" ON public.project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE p.id = project_members.project_id AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_project_membership" ON public.project_members;
CREATE POLICY "delete_own_project_membership" ON public.project_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);