
import { useState } from "react";

interface Workspace {
  id: string;
  name: string;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  brandVaults: BrandVault[];
}

interface BrandVault {
  id: string;
  name: string;
}

export function useWorkspaceData() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: '1',
      name: 'Default Workspace',
      projects: [
        {
          id: '1',
          name: 'Marketing Campaign',
          brandVaults: [
            { id: '1', name: 'Brand Guidelines' },
            { id: '2', name: 'Asset Library' }
          ]
        },
        {
          id: '2',
          name: 'Product Launch',
          brandVaults: [
            { id: '3', name: 'Launch Assets' }
          ]
        }
      ]
    }
  ]);

  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(workspaces[0]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(workspaces[0].projects[0]);
  const [selectedBrandVault, setSelectedBrandVault] = useState<BrandVault | null>(workspaces[0].projects[0].brandVaults[0]);

  const addWorkspace = () => {
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: `Workspace ${workspaces.length + 1}`,
      projects: []
    };
    setWorkspaces([...workspaces, newWorkspace]);
  };

  const addProject = () => {
    if (!selectedWorkspace) return;
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Project ${selectedWorkspace.projects.length + 1}`,
      brandVaults: []
    };
    
    const updatedWorkspaces = workspaces.map(ws => 
      ws.id === selectedWorkspace.id 
        ? { ...ws, projects: [...ws.projects, newProject] }
        : ws
    );
    
    setWorkspaces(updatedWorkspaces);
    setSelectedWorkspace(updatedWorkspaces.find(ws => ws.id === selectedWorkspace.id)!);
  };

  const addBrandVault = () => {
    if (!selectedWorkspace || !selectedProject) return;
    
    const newBrandVault: BrandVault = {
      id: Date.now().toString(),
      name: `Brand Vault ${selectedProject.brandVaults.length + 1}`
    };
    
    const updatedWorkspaces = workspaces.map(ws =>
      ws.id === selectedWorkspace.id
        ? {
            ...ws,
            projects: ws.projects.map(proj =>
              proj.id === selectedProject.id
                ? { ...proj, brandVaults: [...proj.brandVaults, newBrandVault] }
                : proj
            )
          }
        : ws
    );
    
    setWorkspaces(updatedWorkspaces);
    const updatedWorkspace = updatedWorkspaces.find(ws => ws.id === selectedWorkspace.id)!;
    const updatedProject = updatedWorkspace.projects.find(proj => proj.id === selectedProject.id)!;
    setSelectedWorkspace(updatedWorkspace);
    setSelectedProject(updatedProject);
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
  };
}

export type { Workspace, Project, BrandVault };
