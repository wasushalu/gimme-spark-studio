
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Workspace, Project, BrandVault } from "@/types/workspace";

export function useWorkspaceMutations(
  selectedWorkspace: Workspace | null,
  selectedProject: Project | null,
  setSelectedWorkspace: (workspace: Workspace) => void,
  setSelectedProject: (project: Project) => void,
  setSelectedBrandVault: (brandVault: BrandVault) => void
) {
  const queryClient = useQueryClient();

  // Add workspace mutation
  const addWorkspaceMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log('Creating workspace with name:', name);
      
      const { data, error } = await supabase
        .from('workspaces')
        .insert([{ name, description: null }])
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
      
      // Create new workspace object with empty projects array
      const newWorkspace: Workspace = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        projects: [],
      };
      setSelectedWorkspace(newWorkspace);
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
      
      console.log('Creating project with name:', name, 'in workspace:', selectedWorkspace.id);
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, workspace_id: selectedWorkspace.id, description: null }])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }
      
      console.log('Project created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Project created successfully');
      
      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        brandVaults: [],
      };
      setSelectedProject(newProject);
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
      
      console.log('Creating brand vault with name:', name, 'in project:', selectedProject.id);
      
      const { data, error } = await supabase
        .from('brand_vaults')
        .insert([{ name, project_id: selectedProject.id, description: null }])
        .select()
        .single();

      if (error) {
        console.error('Error creating brand vault:', error);
        throw error;
      }
      
      console.log('Brand vault created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Brand vault created successfully');
      
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

  return {
    addWorkspace: (name: string) => addWorkspaceMutation.mutate(name),
    addProject: (name: string) => addProjectMutation.mutate(name),
    addBrandVault: (name: string) => addBrandVaultMutation.mutate(name),
  };
}
