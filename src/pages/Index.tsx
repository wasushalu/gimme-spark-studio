
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Bot, Lightbulb, MessageCircle } from "lucide-react";

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
      id: 'creative_concept',
      name: 'Creative Concept',
      description: 'Creative Ideas Generator',
      icon: Lightbulb,
      primary: false,
    },
    {
      id: 'neutral_chat',
      name: 'General Chat',
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
      {/* Header */}
      <div className="border-b border-border/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-medium text-foreground">gimmefy</h1>
          <Button 
            onClick={() => navigate('/admin')} 
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            Admin
          </Button>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl text-center space-y-8">
          
          {/* Main Heading */}
          <div className="space-y-3">
            <h2 className="text-4xl font-semibold text-foreground">
              How can I help you today?
            </h2>
          </div>

          {/* Agent Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const IconComponent = agent.icon;
              return (
                <Card 
                  key={agent.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-border/50"
                  onClick={() => handleAgentSelect(agent.id)}
                >
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <IconComponent className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Primary CTA */}
          <div className="pt-4">
            <Button 
              onClick={() => handleAgentSelect('gimmebot')}
              size="lg"
              className="px-8 py-3 text-base"
            >
              Start with gimmebot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
