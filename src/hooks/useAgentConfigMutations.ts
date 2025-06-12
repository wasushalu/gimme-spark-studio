
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Agent, AgentConfigVersion } from '@/types/database';

export function useAgentConfigMutations(agent: Agent | null, currentConfig: AgentConfigVersion | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig: any) => {
      if (!agent) throw new Error('No agent selected');
      
      console.log('useAgentConfigMutations: Saving config with prompt:', newConfig.prompt);
      
      const nextVersion = (currentConfig?.version || 0) + 1;
      
      // Deactivate current version if exists
      if (currentConfig) {
        await supabase
          .from('agent_config_versions')
          .update({ is_active: false })
          .eq('agent_id', agent.agent_id)
          .eq('is_active', true);
      }

      // Insert new version with the complete config including prompt
      const { error } = await supabase
        .from('agent_config_versions')
        .insert({
          agent_id: agent.agent_id,
          version: nextVersion,
          is_active: true,
          settings: newConfig
        });

      if (error) {
        console.error('useAgentConfigMutations: Error saving config:', error);
        throw error;
      }
      
      console.log('useAgentConfigMutations: Config saved successfully');
    },
    onSuccess: () => {
      toast({
        title: 'Configuration saved',
        description: 'Agent configuration has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['agent-config', agent?.agent_id] });
    },
    onError: (error) => {
      console.error('useAgentConfigMutations: Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    }
  });

  return {
    saveConfigMutation
  };
}
