
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Palette, MessageCircle } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  primary: boolean;
  welcomeMessage: string;
}

interface AgentSelectorProps {
  activeAgent: string;
  onAgentSelect: (agentId: string) => void;
}

const agents: Agent[] = [
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

export function AgentSelector({ activeAgent, onAgentSelect }: AgentSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {agents.map((agent) => {
        const isActive = activeAgent === agent.id;
        return (
          <Card 
            key={agent.id}
            className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border-border/50 h-20 ${
              isActive ? 'bg-orange-400 text-white border-orange-400 ring-2 ring-orange-400/50' : ''
            }`}
            onClick={() => onAgentSelect(agent.id)}
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
  );
}

export { agents };
export type { Agent };
