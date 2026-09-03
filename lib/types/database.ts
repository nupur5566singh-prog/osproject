export type WorkspaceRole = 'owner' | 'member';
export type ProjectRole = 'owner' | 'member';
export type ProjectType = 'general' | 'software';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  project_type: ProjectType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

export interface ProjectWithCreator extends Project {
  creator_name: string | null;
}
