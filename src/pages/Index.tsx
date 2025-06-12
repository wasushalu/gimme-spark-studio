
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Bot, Palette, MessageCircle, ChevronDown, Plus } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

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

const Index = () => {
  const navigate = useNavigate();
  const [activeAgent, setActiveAgent] = useState<string>('gimmebot');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sample data structure for the hierarchy
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

  const agents = [
    {
      id: 'gimmebot',
      name: 'gimmebot',
      description: 'AI Marketing Assistant',
      icon: Bot,
      primary: true,
      welcomeMessage: 'Hello! I\'m gimmebot, your AI marketing assistant. How can I help you create amazing marketing content today?'
    },
    {
      id: 'studio',
      name: 'studio',
      description: 'Creative Ideas Generator',
      icon: Palette,
      primary: false,
      welcomeMessage: 'Hi there! I\'m Studio, your creative ideas generator. What creative project can I help you brainstorm today?'
    },
    {
      id: 'neutral_chat',
      name: 'neutral chat',
      description: 'Open Conversation',
      icon: MessageCircle,
      primary: false,
      welcomeMessage: 'Hello! I\'m here for open conversation. What would you like to chat about?'
    },
  ];

  const currentAgent = agents.find(agent => agent.id === activeAgent) || agents[0];

  const handleAgentSelect = (agentId: string) => {
    setActiveAgent(agentId);
    setMessages([]); // Clear messages when switching agents
  };

  const handleSendMessage = (message: string) => {
    setIsLoading(true);
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Thank you for your message! I'm ${currentAgent.name} and I'll help you with that.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

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

  const handleGoClick = () => {
    if (selectedBrandVault) {
      setActiveAgent('studio');
      setMessages([]); // Clear messages when switching to studio
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Navigation */}
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
                    onClick={() => handleWorkspaceSelect(workspace)}
                    className="cursor-pointer"
                  >
                    {workspace.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={addWorkspace} className="cursor-pointer flex items-center gap-2">
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
                    onClick={() => handleProjectSelect(project)}
                    className="cursor-pointer"
                  >
                    {project.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={addProject} className="cursor-pointer flex items-center gap-2" disabled={!selectedWorkspace}>
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
                    onClick={() => handleBrandVaultSelect(brandVault)}
                    className="cursor-pointer"
                  >
                    {brandVault.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={addBrandVault} className="cursor-pointer flex items-center gap-2" disabled={!selectedProject}>
                  <Plus className="h-4 w-4" />
                  Add Brand Vault
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Go Button */}
            <Button 
              onClick={handleGoClick}
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

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Content Area */}
        <div className="flex-1 p-8">
          {/* Agent Selection Cards - Top Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {agents.map((agent) => {
              const IconComponent = agent.icon;
              const isActive = activeAgent === agent.id;
              return (
                <Card 
                  key={agent.id}
                  className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-border/50 h-20 ${
                    isActive ? 'bg-orange-400 text-white border-orange-400 ring-2 ring-orange-400/50' : ''
                  }`}
                  onClick={() => handleAgentSelect(agent.id)}
                >
                  <CardContent className="p-4 flex items-center justify-center h-full">
                    <h3 className={`font-medium text-center ${
                      isActive ? 'text-white' : 'text-foreground'
                    }`}>
                      {agent.name}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Chat Interface */}
          <div className="h-[600px] border border-border/50 rounded-lg overflow-hidden">
            <ChatInterface
              agentName={currentAgent.name}
              agentDescription={currentAgent.description}
              agentIcon={currentAgent.icon}
              welcomeMessage={currentAgent.welcomeMessage}
              placeholder={`Message ${currentAgent.name}...`}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              messages={messages}
            />
          </div>
        </div>

        {/* Right Sidebar - Empty for now */}
        <div className="w-80 border-l border-border/20 bg-muted/20">
          {/* Right sidebar content can go here */}
        </div>
      </div>
    </div>
  );
};

export default Index;
