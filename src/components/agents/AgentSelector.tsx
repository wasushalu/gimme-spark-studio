

import { Card, CardContent } from "@/components/ui/card";
import { Bot, Palette, MessageCircle } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  primary: boolean;
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
  },
  {
    id: 'creative_concept',
    name: 'studio',
    description: 'Creative Ideas Generator',
    icon: Palette,
    primary: false,
  },
  {
    id: 'neutral_chat',
    name: 'Jack',
    description: 'Open Conversation',
    icon: MessageCircle,
    primary: false,
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

