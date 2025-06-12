
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AgentConfigVersion } from '@/types/database';

export function useChatConfig(
  agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat',
  canUseAgent: boolean
) {
  return useQuery({
    queryKey: ['agent-config', agentType],
    queryFn: async () => {
      console.log('useChatConfig: Fetching config for agent type:', agentType);
      
      const { data: configData, error: configError } = await supabase
        .from('agent_config_versions')
        .select('*')
        .eq('agent_id', agentType)
        .eq('is_active', true)
        .maybeSingle();

      if (configError) {
        console.error('useChatConfig: Error fetching agent config:', configError);
        return null;
      }
      
      console.log('useChatConfig: Agent config result:', configData);
      
      return configData as AgentConfigVersion;
    },
    enabled: canUseAgent,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
