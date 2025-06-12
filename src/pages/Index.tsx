
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Bot, Palette, MessageCircle } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

const Index = () => {
  const navigate = useNavigate();
  const [activeAgent, setActiveAgent] = useState<string>('gimmebot');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
