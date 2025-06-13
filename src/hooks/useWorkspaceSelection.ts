
import { useState, useEffect } from "react";
import { Workspace, Project, BrandVault } from "@/types/workspace";

export function useWorkspaceSelection(workspaces: Workspace[]) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBrandVault, setSelectedBrandVault] = useState<BrandVault | null>(null);

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
    selectedWorkspace,
    selectedProject,
    selectedBrandVault,
    handleWorkspaceSelect,
    handleProjectSelect,
    handleBrandVaultSelect,
  };
}
