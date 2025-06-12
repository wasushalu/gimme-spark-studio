
import { WorkspaceNavigation } from "@/components/navigation/WorkspaceNavigation";
import { AgentSelector } from "@/components/agents/AgentSelector";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";
import { useChatData } from "@/hooks/useChatData";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const {
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
  } = useWorkspaceData();

  const {
    activeAgent,
    messages,
    isLoading,
    currentAgent,
    handleAgentSelect,
    handleSendMessage,
    canUseAgent,
    needsAuth,
  } = useChatData();

  const handleGoClick = () => {
    if (selectedBrandVault) {
      handleAgentSelect('creative_concept');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Navigation */}
      <WorkspaceNavigation
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        selectedProject={selectedProject}
        selectedBrandVault={selectedBrandVault}
        onWorkspaceSelect={handleWorkspaceSelect}
        onProjectSelect={handleProjectSelect}
        onBrandVaultSelect={handleBrandVaultSelect}
        onAddWorkspace={addWorkspace}
        onAddProject={addProject}
        onAddBrandVault={addBrandVault}
        onGoClick={handleGoClick}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Content Area */}
        <div className="flex-1 p-8">
          {/* Agent Selection Cards - Top Row */}
          <AgentSelector
            activeAgent={activeAgent}
            onAgentSelect={handleAgentSelect}
          />

          {/* Chat Interface */}
          <div className="h-[600px] border border-border/50 rounded-lg overflow-hidden">
            {!canUseAgent ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <Lock className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground mb-6">
                  Please sign in to chat with {currentAgent.name}. You can continue using gimmebot without signing in.
                </p>
                <Button onClick={() => handleAgentSelect('gimmebot')}>
                  Switch to gimmebot
                </Button>
              </div>
            ) : (
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
            )}
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
