
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  brandVaults: BrandVault[];
}

export interface BrandVault {
  id: string;
  name: string;
  description?: string;
}

// Database types
export interface DbWorkspace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBrandVault {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}
