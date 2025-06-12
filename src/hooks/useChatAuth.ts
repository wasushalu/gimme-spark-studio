
import { useMemo } from 'react';
import { useAuth } from './useAuth';

export function useChatAuth(agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat') {
  const { user } = useAuth();

  return useMemo(() => {
    const needsAuth = agentType !== 'gimmebot';
    const canUseAgent = !needsAuth || !!user;
    return { needsAuth, canUseAgent, user };
  }, [agentType, user]);
}
