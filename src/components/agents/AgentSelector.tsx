
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
  'studio': Palette,
  'neutral_chat': MessageCircle,
  'default': Bot,
};

// Define the three main agents that should be displayed
const MAIN_AGENTS = ['gimmebot', 'studio', 'neutral_chat'] as const;

// Fallback agents - only the three main agents
const FALLBACK_AGENTS: Agent[] = [
  {
    id: 'gimmebot',
    name: 'gimmebot',
    description: 'AI Marketing Assistant',
    icon: Bot,
    primary: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Creative Hub',
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
  const { data: dbAgents, isLoading, error } = useQuery({
    queryKey: ['main-agents'],
    queryFn: async () => {
      console.log('AgentSelector: Fetching main agents from database');
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .in('agent_id', MAIN_AGENTS)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('AgentSelector: Error fetching agents:', error);
        throw error;
      }
      
      console.log('AgentSelector: Successfully fetched agents:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });

  // Transform database agents to component format
  const agents: Agent[] = (dbAgents || []).map(agent => ({
    id: agent.agent_id,
    name: agent.agent_id === 'neutral_chat' ? 'Jack' : agent.label,
    description: agent.type === 'root' ? 'Primary Assistant' : 'Specialized Assistant',
    icon: iconMap[agent.agent_id] || iconMap.default,
    primary: agent.agent_id === 'gimmebot',
  }));

  // Use database agents if available, otherwise fallback agents
  const displayAgents = agents.length > 0 ? agents : FALLBACK_AGENTS;

  // Ensure we only display the main agents
  const filteredAgents = displayAgents.filter(agent => 
    MAIN_AGENTS.includes(agent.id as typeof MAIN_AGENTS[number])
  );

  if (error) {
    console.error('AgentSelector: Query error, using fallback agents');
    // Silently fall back to static agents if database fails
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 mb-8">
        {FALLBACK_AGENTS.map((_, index) => (
          <Card key={index} className="h-20 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {filteredAgents.map((agent) => {
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

// Export only the three main agents
export const agents = FALLBACK_AGENTS;

export type { Agent };
