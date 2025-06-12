
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Palette, MessageCircle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

// Icon mapping for database agents
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'gimmebot': Bot,
  'creative_concept': Palette,
  'neutral_chat': MessageCircle,
  'default': Bot,
};

export function AgentSelector({ activeAgent, onAgentSelect }: AgentSelectorProps) {
  const { data: dbAgents, isLoading } = useQuery({
    queryKey: ['public-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching agents:', error);
        return [];
      }
      
      return data;
    }
  });

  // Transform database agents to component format
  const agents: Agent[] = (dbAgents || []).map(agent => ({
    id: agent.agent_id,
    name: agent.label,
    description: agent.type === 'root' ? 'Primary Assistant' : 'Specialized Assistant',
    icon: iconMap[agent.agent_id] || iconMap.default,
    primary: agent.agent_id === 'gimmebot',
  }));

  // Fallback agents if database is empty or loading
  const fallbackAgents: Agent[] = [
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

  const displayAgents = agents.length > 0 ? agents : fallbackAgents;

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-20 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {displayAgents.map((agent) => {
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

// Export the icon mapping for backward compatibility
export const agents = [
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

export type { Agent };
