/*
# ProjectOS Foundation Schema

## Overview
Creates the core database tables for the ProjectOS SaaS project-management platform:
profiles, workspaces, workspace_members, projects, and project_members.

## New Tables

1. **profiles**
   - `id` (uuid, PK, references auth.users) — one-to-one with Supabase auth users
   - `full_name` (text) — display name
   - `avatar_url` (text) — optional avatar image URL
   - `created_at` (timestamptz) — record creation
   - `updated_at` (timestamptz) — last update

2. **workspaces**
   - `id` (uuid, PK)
   - `name` (text, not null) — workspace display name
   - `slug` (text, unique, not null) — URL-friendly identifier
   - `created_by` (uuid, not null, references auth.users) — owner
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

3. **workspace_members**
   - `id` (uuid, PK)
   - `workspace_id` (uuid, FK → workspaces, ON DELETE CASCADE)
   - `user_id` (uuid, FK → auth.users, ON DELETE CASCADE)
   - `role` (text, not null, default 'owner') — 'owner' | 'member' (future: admin, viewer)
   - `created_at` (timestamptz)
   - Unique constraint on (workspace_id, user_id)

4. **projects**
   - `id` (uuid, PK)
   - `workspace_id` (uuid, FK → workspaces, ON DELETE CASCADE)
   - `name` (text, not null)
   - `description` (text)
   - `project_type` (text, not null, default 'general') — 'general' | 'software'
   - `created_by` (uuid, not null, references auth.users)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

5. **project_members**
   - `id` (uuid, PK)
   - `project_id` (uuid, FK → projects, ON DELETE CASCADE)
   - `user_id` (uuid, FK → auth.users, ON DELETE CASCADE)
   - `role` (text, not null, default 'member') — 'owner' | 'member'
   - `created_at` (timestamptz)
   - Unique constraint on (project_id, user_id)

## Indexes
- workspaces.slug (unique index for fast slug lookups)
- workspaces.created_by (fast owner queries)
- workspace_members.user_id (fast membership lookups)
- workspace_members.workspace_id (fast workspace member lists)
- projects.workspace_id (fast project listing per workspace)
- projects.created_by (fast owner queries)
- project_members.user_id (fast membership lookups)
- project_members.project_id (fast project member lists)

## Security (RLS)
All tables have RLS enabled. Policies enforce:
- **profiles**: users can read/update only their own profile
- **workspaces**: users can CRUD only workspaces they are a member of (via workspace_members)
- **workspace_members**: users can read memberships for workspaces they belong to; can insert membership for themselves; can update/delete only their own membership rows (owners manage members in future phases)
- **projects**: users can CRUD only projects in workspaces they are a member of
- **project_members**: users can read memberships for projects in workspaces they belong to; can insert their own membership; can delete their own membership

## Trigger
- `handle_new_user` trigger: when a new auth.users row is created, automatically insert a corresponding profiles row. This ensures every signed-up user has a profile.

## Important Notes
1. `created_by` columns on workspaces and projects do NOT have DEFAULT auth.uid() because the client explicitly passes the user ID. However, RLS WITH CHECK enforces that the creator matches auth.uid().
2. workspace_members role defaults to 'owner' for the initial member created during workspace creation.
3. The handle_new_user trigger fires AFTER INSERT on auth.users, inserting into profiles with the new user's id and email-derived metadata.
4. All policies use auth.uid() — never current_user.
*/