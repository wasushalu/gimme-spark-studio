
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus } from "lucide-react";

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

interface WorkspaceNavigationProps {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  selectedProject: Project | null;
  selectedBrandVault: BrandVault | null;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onProjectSelect: (project: Project) => void;
  onBrandVaultSelect: (brandVault: BrandVault) => void;
  onAddWorkspace: () => void;
  onAddProject: () => void;
  onAddBrandVault: () => void;
  onGoClick: () => void;
}

export function WorkspaceNavigation({
  workspaces,
  selectedWorkspace,
  selectedProject,
  selectedBrandVault,
  onWorkspaceSelect,
  onProjectSelect,
  onBrandVaultSelect,
  onAddWorkspace,
  onAddProject,
  onAddBrandVault,
  onGoClick,
}: WorkspaceNavigationProps) {
  return (
    <div className="border-b border-border/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          {/* Workspace Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="px-4 py-2 border-b-2 border-primary text-foreground font-medium flex items-center gap-2">
                Workspace: {selectedWorkspace?.name || 'Select Workspace'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border shadow-lg">
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => onWorkspaceSelect(workspace)}
                  className="cursor-pointer"
                >
                  {workspace.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAddWorkspace} className="cursor-pointer flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Projects Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="px-4 py-2 text-muted-foreground font-medium flex items-center gap-2"
                disabled={!selectedWorkspace}
              >
                Projects: {selectedProject?.name || 'Select Project'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border shadow-lg">
              {selectedWorkspace?.projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onProjectSelect(project)}
                  className="cursor-pointer"
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAddProject} className="cursor-pointer flex items-center gap-2" disabled={!selectedWorkspace}>
                <Plus className="h-4 w-4" />
                Add Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Brand Vault Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="px-4 py-2 text-muted-foreground font-medium flex items-center gap-2"
                disabled={!selectedProject}
              >
                Brand Vault: {selectedBrandVault?.name || 'Select Brand Vault'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border shadow-lg">
              {selectedProject?.brandVaults.map((brandVault) => (
                <DropdownMenuItem
                  key={brandVault.id}
                  onClick={() => onBrandVaultSelect(brandVault)}
                  className="cursor-pointer"
                >
                  {brandVault.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAddBrandVault} className="cursor-pointer flex items-center gap-2" disabled={!selectedProject}>
                <Plus className="h-4 w-4" />
                Add Brand Vault
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Go Button */}
          <Button 
            onClick={onGoClick}
            disabled={!selectedBrandVault}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Go
          </Button>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            Login
          </Button>
          <Button size="sm">
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
}
