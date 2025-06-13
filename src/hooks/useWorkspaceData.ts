
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Workspace, DbWorkspace, DbProject, DbBrandVault } from "@/types/workspace";
import { useWorkspaceSelection } from "./useWorkspaceSelection";
import { useWorkspaceMutations } from "./useWorkspaceMutations";

export function useWorkspaceData() {
  // Fetch workspaces with their projects and brand vaults
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      console.log('Fetching workspaces...');
      
      try {
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
        const workspacesWithData: Workspace[] = (workspacesData || []).map((workspace: DbWorkspace) => {
          const workspaceProjects = (projectsData || [])
            .filter((project: DbProject) => project.workspace_id === workspace.id)
            .map((project: DbProject) => ({
              id: project.id,
              name: project.name,
              description: project.description || undefined,
              brandVaults: (brandVaultsData || [])
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
      } catch (error) {
        console.error('Error in workspace data fetch:', error);
        throw error;
      }
    },
  });

  const {
    selectedWorkspace,
    selectedProject,
    selectedBrandVault,
    handleWorkspaceSelect,
    handleProjectSelect,
    handleBrandVaultSelect,
  } = useWorkspaceSelection(workspaces);

  const { addWorkspace, addProject, addBrandVault } = useWorkspaceMutations(
    selectedWorkspace,
    selectedProject,
    handleWorkspaceSelect,
    handleProjectSelect,
    handleBrandVaultSelect
  );

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

export type { Workspace, Project, BrandVault } from "@/types/workspace";
