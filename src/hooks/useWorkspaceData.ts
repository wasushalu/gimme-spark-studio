
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  description?: string;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  description?: string;
  brandVaults: BrandVault[];
}

interface BrandVault {
  id: string;
  name: string;
  description?: string;
}

// Database types
interface DbWorkspace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface DbProject {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface DbBrandVault {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useWorkspaceData() {
  const queryClient = useQueryClient();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBrandVault, setSelectedBrandVault] = useState<BrandVault | null>(null);

  // Fetch workspaces with their projects and brand vaults
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      console.log('Fetching workspaces...');
      
      // Fetch workspaces
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: true });

      if (workspacesError) {
        console.error('Error fetching workspaces:', workspacesError);
        throw workspacesError;
      }

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }

      // Fetch brand vaults
      const { data: brandVaultsData, error: brandVaultsError } = await supabase
        .from('brand_vaults')
        .select('*')
        .order('created_at', { ascending: true });

      if (brandVaultsError) {
        console.error('Error fetching brand vaults:', brandVaultsError);
        throw brandVaultsError;
      }

      // Transform and combine data
      const workspacesWithData: Workspace[] = workspacesData.map((workspace: DbWorkspace) => {
        const workspaceProjects = projectsData
          .filter((project: DbProject) => project.workspace_id === workspace.id)
          .map((project: DbProject) => ({
            id: project.id,
            name: project.name,
            description: project.description || undefined,
            brandVaults: brandVaultsData
              .filter((vault: DbBrandVault) => vault.project_id === project.id)
              .map((vault: DbBrandVault) => ({
                id: vault.id,
                name: vault.name,
                description: vault.description || undefined,
              }))
          }));

        return {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description || undefined,
          projects: workspaceProjects,
        };
      });

      console.log('Fetched workspaces:', workspacesWithData);
      return workspacesWithData;
    },
  });

  // Set initial selections when data loads
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspace) {
      const defaultWorkspace = workspaces[0];
      setSelectedWorkspace(defaultWorkspace);
      
      if (defaultWorkspace.projects.length > 0) {
        const defaultProject = defaultWorkspace.projects[0];
        setSelectedProject(defaultProject);
        
        if (defaultProject.brandVaults.length > 0) {
          setSelectedBrandVault(defaultProject.brandVaults[0]);
        }
      }
    }
  }, [workspaces, selectedWorkspace]);

  // Add workspace mutation - simplified to not create workspace membership
  const addWorkspaceMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log('Creating workspace with name:', name);
      
      const { data, error } = await supabase
        .from('workspaces')
        .insert([{ name }])
        .select()
        .single();

      if (error) {
        console.error('Error creating workspace:', error);
        throw error;
      }
      
      console.log('Workspace created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created successfully');
      
      // Select the new workspace
      const newWorkspace: Workspace = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        projects: [],
      };
      setSelectedWorkspace(newWorkspace);
      setSelectedProject(null);
      setSelectedBrandVault(null);
    },
    onError: (error) => {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
    },
  });

  // Add project mutation
  const addProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!selectedWorkspace) throw new Error('No workspace selected');
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, workspace_id: selectedWorkspace.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Project created successfully');
      
      // Select the new project
      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        brandVaults: [],
      };
      setSelectedProject(newProject);
      setSelectedBrandVault(null);
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    },
  });

  // Add brand vault mutation
  const addBrandVaultMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!selectedProject) throw new Error('No project selected');
      
      const { data, error } = await supabase
        .from('brand_vaults')
        .insert([{ name, project_id: selectedProject.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Brand vault created successfully');
      
      // Select the new brand vault
      const newBrandVault: BrandVault = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
      };
      setSelectedBrandVault(newBrandVault);
    },
    onError: (error) => {
      console.error('Error creating brand vault:', error);
      toast.error('Failed to create brand vault');
    },
  });

  const addWorkspace = (name: string) => {
    addWorkspaceMutation.mutate(name);
  };

  const addProject = (name: string) => {
    addProjectMutation.mutate(name);
  };

  const addBrandVault = (name: string) => {
    addBrandVaultMutation.mutate(name);
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setSelectedProject(null);
    setSelectedBrandVault(null);
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setSelectedBrandVault(null);
  };

  const handleBrandVaultSelect = (brandVault: BrandVault) => {
    setSelectedBrandVault(brandVault);
  };

  return {
    workspaces,
    selectedWorkspace,
    selectedProject,
    selectedBrandVault,
    addWorkspace,
    addProject,
    addBrandVault,
    handleWorkspaceSelect,
    handleProjectSelect,
    handleBrandVaultSelect,
    isLoading,
  };
}

export type { Workspace, Project, BrandVault };
