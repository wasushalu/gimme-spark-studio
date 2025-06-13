
import { useMemo } from 'react';
import { useAuth } from './useAuth';

type AgentType = 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio';

export function useChatAuth(agentType: AgentType) {
  const { user } = useAuth();

  return useMemo(() => {
    // Only gimmebot is available without authentication
    const needsAuth = agentType !== 'gimmebot';
    const canUseAgent = !needsAuth || !!user;
    
    console.log(`useChatAuth: Agent ${agentType}, needsAuth: ${needsAuth}, canUseAgent: ${canUseAgent}`);
    
    return { needsAuth, canUseAgent, user };
  }, [agentType, user]);
}
