
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

  const addWorkspace = (name: string) => {
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: name,
      projects: []
    };
    const updatedWorkspaces = [...workspaces, newWorkspace];
    setWorkspaces(updatedWorkspaces);
    setSelectedWorkspace(newWorkspace);
    setSelectedProject(null);
    setSelectedBrandVault(null);
  };

  const addProject = (name: string) => {
    if (!selectedWorkspace) return;
    
    const newProject: Project = {
      id: Date.now().toString(),
      name: name,
      brandVaults: []
    };
    
    const updatedWorkspaces = workspaces.map(ws => 
      ws.id === selectedWorkspace.id 
        ? { ...ws, projects: [...ws.projects, newProject] }
        : ws
    );
    
    setWorkspaces(updatedWorkspaces);
    const updatedWorkspace = updatedWorkspaces.find(ws => ws.id === selectedWorkspace.id)!;
    setSelectedWorkspace(updatedWorkspace);
    setSelectedProject(newProject);
    setSelectedBrandVault(null);
  };

  const addBrandVault = (name: string) => {
    if (!selectedWorkspace || !selectedProject) return;
    
    const newBrandVault: BrandVault = {
      id: Date.now().toString(),
      name: name
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
    setSelectedBrandVault(newBrandVault);
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
