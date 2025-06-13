
import { useMemo } from 'react';

type AgentType = 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio';

export function useChatAuth(agentType: AgentType) {
  return useMemo(() => {
    // No authentication required - everything is public
    const needsAuth = false;
    const canUseAgent = true;
    
    console.log(`useChatAuth: Agent ${agentType}, needsAuth: ${needsAuth}, canUseAgent: ${canUseAgent}`);
    
    return { needsAuth, canUseAgent, user: null };
  }, [agentType]);
}
