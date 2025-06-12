
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Agent, AgentConfigVersion, ModelCatalog } from '@/types/database';

export function useAgentConfig(agent: Agent | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current agent configuration
  const { data: currentConfig } = useQuery({
    queryKey: ['agent-config', agent?.agent_id],
    queryFn: async () => {
      if (!agent) return null;
      
      const { data, error } = await supabase
        .from('agent_config_versions')
        .select('*')
        .eq('agent_id', agent.agent_id)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching config:', error);
      }
      return data as AgentConfigVersion | null;
    },
    enabled: !!agent
  });

  // Fetch available models
  const { data: models = [], isLoading: modelsLoading, error: modelsError } = useQuery({
    queryKey: ['models-for-config'],
    queryFn: async () => {
      console.log('Fetching models for agent configuration...');
      const { data, error } = await supabase
        .from('model_catalog')
        .select('*')
        .eq('enabled', true)
        .order('provider', { ascending: true })
        .order('model_name', { ascending: true });
      
      console.log('Models query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error('Error fetching models for config:', error);
        throw error;
      }
      
      return data as ModelCatalog[];
    }
  });

  const defaultConfig = {
    model: {
      text: { provider: 'openai', model: 'gpt-4o-mini' },
      image: { provider: 'openai', model: 'dall-e-3' },
      audio: { provider: null, model: null },
      video: { provider: null, model: null }
    },
    generation: {
      max_context_tokens: 8000,
      max_response_tokens: 4000,
      temperature: 0.7,
      top_p: 1
    },
    prompt: '',
    tools: [],
    knowledge_base: {
      enabled: false,
      vector_store_id: null,
      chunk_size: 300,
      chunk_overlap: 50,
      retrieval_depth: 5,
      keyword_extraction: 'tfidf'
    },
    agent_as_tool: {
      expose: false,
      function_name: '',
      signature: {}
    },
    router: {
      strategy: 'manual',
      default_child: null
    }
  };

  const [config, setConfig] = useState(() => {
    return currentConfig?.settings || defaultConfig;
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig: any) => {
      if (!agent) throw new Error('No agent selected');
      
      const nextVersion = (currentConfig?.version || 0) + 1;
      
      // Deactivate current version if exists
      if (currentConfig) {
        await supabase
          .from('agent_config_versions')
          .update({ is_active: false })
          .eq('agent_id', agent.agent_id)
          .eq('is_active', true);
      }

      // Insert new version
      const { error } = await supabase
        .from('agent_config_versions')
        .insert({
          agent_id: agent.agent_id,
          version: nextVersion,
          is_active: true,
          settings: newConfig
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Configuration saved',
        description: 'Agent configuration has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['agent-config', agent?.agent_id] });
    },
    onError: (error) => {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const getModelsByModality = (modality: string) => {
    return models.filter(model => model.modality === modality);
  };

  return {
    config,
    setConfig,
    currentConfig,
    models,
    modelsLoading,
    modelsError,
    saveConfigMutation,
    getModelsByModality
  };
}
