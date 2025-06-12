
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Bot, Studio, MessageCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const agents = [
    {
      id: 'gimmebot',
      name: 'gimmebot',
      description: 'AI Marketing Assistant',
      icon: Bot,
      primary: true,
    },
    {
      id: 'studio',
      name: 'studio',
      description: 'Creative Ideas Generator',
      icon: Studio,
      primary: false,
    },
    {
      id: 'neutral_chat',
      name: 'neutral chat',
      description: 'Open Conversation',
      icon: MessageCircle,
      primary: false,
    },
  ];

  const handleAgentSelect = (agentId: string) => {
    navigate(`/chat?agent=${agentId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Navigation */}
      <div className="border-b border-border/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex space-x-8">
            <div className="px-4 py-2 border-b-2 border-primary text-foreground font-medium">
              Workspace
            </div>
            <div className="px-4 py-2 text-muted-foreground font-medium">
              Projects
            </div>
            <div className="px-4 py-2 text-muted-foreground font-medium">
              Brand Vault
            </div>
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
              return (
                <Card 
                  key={agent.id}
                  className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-border/50 h-20 ${
                    agent.id === 'gimmebot' ? 'bg-orange-400 text-white border-orange-400' : ''
                  }`}
                  onClick={() => handleAgentSelect(agent.id)}
                >
                  <CardContent className="p-4 flex items-center justify-center h-full">
                    <h3 className={`font-medium text-center ${
                      agent.id === 'gimmebot' ? 'text-white' : 'text-foreground'
                    }`}>
                      {agent.name}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Center Content */}
          <div className="flex flex-col items-center justify-center space-y-6 mt-16">
            <div className="text-center space-y-2">
              <p className="text-lg text-muted-foreground">What can you help me with?</p>
              <p className="text-lg text-muted-foreground">Tell me about your features</p>
              <p className="text-lg text-muted-foreground">How do I get started?</p>
            </div>

            {/* Chat Input */}
            <div className="w-full max-w-2xl mt-12">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center h-12">
                    <span className="text-muted-foreground">chatbox</span>
                  </div>
                </CardContent>
              </Card>
            </div>
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
