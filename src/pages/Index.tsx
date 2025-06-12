
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold gradient-text">gimmefy</h1>
          <Button 
            onClick={() => navigate('/admin')} 
            variant="ghost"
            size="sm"
          >
            Admin
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">AI Marketing Studio</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose your AI assistant and start creating amazing marketing content
          </p>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {agents.map((agent) => {
            const IconComponent = agent.icon;
            return (
              <Card 
                key={agent.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  agent.primary ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                onClick={() => handleAgentSelect(agent.id)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    agent.primary ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className="mb-2">{agent.name}</CardTitle>
                  <CardDescription className="mb-4">{agent.description}</CardDescription>
                  <Button 
                    className="w-full"
                    variant={agent.primary ? "default" : "outline"}
                  >
                    Start Chat
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Start with gimmebot */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Ready to get started? Jump right into gimmebot
          </p>
          <Button 
            onClick={() => handleAgentSelect('gimmebot')}
            size="lg"
            className="px-8"
          >
            Start with gimmebot
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
