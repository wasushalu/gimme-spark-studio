
import { WorkspaceNavigation } from "@/components/navigation/WorkspaceNavigation";
import { AgentSelector } from "@/components/agents/AgentSelector";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";
import { useChatData } from "@/hooks/useChatData";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageCircle, Zap, Users, TrendingUp } from "lucide-react";

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

  // Convert ChatMessage[] to Message[] format expected by ChatInterface
  const formattedMessages = messages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.created_at)
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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
      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Left Content Area */}
        <div className="flex-1 space-y-8">
          {/* Welcome Section */}
          <div className="text-center lg:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI-Powered Marketing Platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Welcome to{" "}
              <span className="gradient-text">gimmefy</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Choose your AI assistant and start creating amazing marketing content, campaigns, and strategies.
            </p>
          </div>

          {/* Agent Selection Cards */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-primary" />
              Choose Your AI Assistant
            </h2>
            <AgentSelector
              activeAgent={activeAgent}
              onAgentSelect={handleAgentSelect}
            />
          </div>

          {/* Chat Interface */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Chat with {currentAgent.name}
              </h2>
              {!user && (
                <Badge variant="secondary" className="text-xs">
                  Guest Mode
                </Badge>
              )}
            </div>
            
            <Card className="notion-shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <div className="h-[600px] overflow-hidden rounded-lg">
                <ChatInterface
                  agentName={currentAgent.name}
                  agentDescription={currentAgent.description}
                  welcomeMessage={currentAgent.welcomeMessage}
                  placeholder={`Message ${currentAgent.name}...`}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  messages={formattedMessages}
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Platform Stats */}
          <Card className="p-6 notion-shadow bg-gradient-to-br from-primary/5 to-creative/5 border-0">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Platform Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <Badge variant="secondary">12.5K+</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Content Generated</span>
                <Badge variant="secondary">1.2M+</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Campaigns Created</span>
                <Badge variant="secondary">45K+</Badge>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 notion-shadow border-0">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleAgentSelect('gimmebot')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start with gimmebot
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleAgentSelect('creative_concept')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Creative Studio
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleAgentSelect('neutral_chat')}
              >
                <Users className="w-4 h-4 mr-2" />
                General Chat
              </Button>
            </div>
          </Card>

          {/* Tips & Tricks */}
          <Card className="p-6 notion-shadow border-0">
            <h3 className="font-semibold text-lg mb-4">💡 Pro Tips</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <p>Be specific about your target audience and goals for better results</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <p>Use brand vault for consistent messaging across campaigns</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <p>Try different agents for varied creative perspectives</p>
              </div>
            </div>
          </Card>

          {/* Feature Highlight */}
          <Card className="p-6 notion-shadow border-0 bg-gradient-to-br from-creative/5 to-marketing/5">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary to-creative flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">New Feature</h3>
              <p className="text-sm text-muted-foreground">
                Advanced image generation is now available in Studio mode!
              </p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => handleAgentSelect('creative_concept')}
              >
                Try Studio
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
