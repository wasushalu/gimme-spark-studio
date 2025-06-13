
import { useMemo } from 'react';
import { useAuth } from './useAuth';

type AgentType = 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio';

export function useChatAuth(agentType: AgentType) {
  const { user } = useAuth();

  return useMemo(() => {
    // For now, no agents require authentication - we'll add this back later
    const needsAuth = false;
    const canUseAgent = true;
    
    console.log(`useChatAuth: Agent ${agentType}, needsAuth: ${needsAuth}, canUseAgent: ${canUseAgent}`);
    
    return { needsAuth, canUseAgent, user };
  }, [agentType, user]);
}
