import { useState, useEffect } from 'react';
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
      
      console.log('useAgentConfig: Fetching config for agent:', agent.agent_id);
      const { data, error } = await supabase
        .from('agent_config_versions')
        .select('*')
        .eq('agent_id', agent.agent_id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error('useAgentConfig: Error fetching config:', error);
        return null;
      }
      console.log('useAgentConfig: Config result:', data);
      return data as AgentConfigVersion | null;
    },
    enabled: !!agent
  });

  // Fetch available models with enhanced debugging
  const { data: models = [], isLoading: modelsLoading, error: modelsError } = useQuery({
    queryKey: ['models-for-config'],
    queryFn: async () => {
      console.log('useAgentConfig: Starting to fetch models...');
      
      try {
        const { data, error } = await supabase
          .from('model_catalog')
          .select('*')
          .eq('enabled', true)
          .order('provider', { ascending: true })
          .order('model_name', { ascending: true });
        
        if (error) {
          console.error('useAgentConfig: Database error fetching models:', error);
          throw error;
        }

        console.log('useAgentConfig: Raw models from database:', data);
        console.log('useAgentConfig: Models breakdown:', {
          total: data?.length || 0,
          byModality: {
            text: data?.filter(m => m.modality === 'text').length || 0,
            image: data?.filter(m => m.modality === 'image').length || 0,
            audio: data?.filter(m => m.modality === 'audio').length || 0,
            video: data?.filter(m => m.modality === 'video').length || 0,
          },
          byProvider: data?.reduce((acc, model) => {
            acc[model.provider] = (acc[model.provider] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
          enabledCount: data?.filter(m => m.enabled).length || 0,
          allProviders: [...new Set(data?.map(m => m.provider) || [])],
          allModalities: [...new Set(data?.map(m => m.modality) || [])]
        });
        
        return data as ModelCatalog[];
      } catch (error) {
        console.error('useAgentConfig: Exception while fetching models:', error);
        throw error;
      }
    }
  });

  // Create a minimal default config only when no config exists
  const createDefaultConfig = () => {
    console.log('useAgentConfig: Creating default config with models:', {
      totalModels: models.length,
      textModels: models.filter(m => m.modality === 'text').length,
      imageModels: models.filter(m => m.modality === 'image').length,
      audioModels: models.filter(m => m.modality === 'audio').length,
      videoModels: models.filter(m => m.modality === 'video').length,
    });

    const textModels = models.filter(m => m.modality === 'text');
    const imageModels = models.filter(m => m.modality === 'image');
    const audioModels = models.filter(m => m.modality === 'audio');
    const videoModels = models.filter(m => m.modality === 'video');

    const defaultConfig = {
      model: {
        text: { 
          provider: textModels[0]?.provider || 'openai', 
          model: textModels[0]?.model_name || 'gpt-4o-mini' 
        },
        image: { 
          provider: imageModels[0]?.provider || 'openai', 
          model: imageModels[0]?.model_name || 'dall-e-3' 
        },
        audio: { 
          provider: audioModels[0]?.provider || 'elevenlabs', 
          model: audioModels[0]?.model_name || 'eleven_multilingual_v2' 
        },
        video: { 
          provider: videoModels[0]?.provider || 'openai', 
          model: videoModels[0]?.model_name || 'sora' 
        }
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

    console.log('useAgentConfig: Created default config:', defaultConfig);
    return defaultConfig;
  };

  // Initialize config state properly
  const [config, setConfig] = useState(() => createDefaultConfig());

  // Update config when currentConfig changes or models are loaded
  useEffect(() => {
    if (currentConfig?.settings) {
      console.log('useAgentConfig: Updating config from currentConfig:', currentConfig.settings);
      // Ensure prompt is preserved
      const updatedConfig = {
        ...currentConfig.settings,
        prompt: currentConfig.settings.prompt || ''
      };
      setConfig(updatedConfig);
    } else if (models.length > 0 && !currentConfig) {
      console.log('useAgentConfig: Creating default config from available models');
      setConfig(createDefaultConfig());
    }
  }, [currentConfig, models]);

  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig: any) => {
      if (!agent) throw new Error('No agent selected');
      
      console.log('useAgentConfig: Saving config with prompt:', newConfig.prompt);
      
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
        console.error('useAgentConfig: Error saving config:', error);
        throw error;
      }
      
      console.log('useAgentConfig: Config saved successfully');
    },
    onSuccess: () => {
      toast({
        title: 'Configuration saved',
        description: 'Agent configuration has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['agent-config', agent?.agent_id] });
    },
    onError: (error) => {
      console.error('useAgentConfig: Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const getModelsByModality = (modality: string) => {
    const filtered = models.filter(model => model.modality === modality);
    console.log(`useAgentConfig: getModelsByModality(${modality}) returning ${filtered.length} models:`, 
      filtered.map(m => ({ name: m.model_name, provider: m.provider, enabled: m.enabled }))
    );
    return filtered;
  };

  // Enhanced debug logging
  console.log('useAgentConfig: Hook state summary:', {
    agentId: agent?.agent_id,
    modelsLoading,
    modelsError: modelsError?.message,
    totalModels: models.length,
    modelsByModality: {
      text: getModelsByModality('text').length,
      image: getModelsByModality('image').length,
      audio: getModelsByModality('audio').length,
      video: getModelsByModality('video').length,
    },
    configLoaded: !!config,
    promptLength: config?.prompt?.length || 0,
    currentSelections: {
      text: config?.model?.text?.model,
      image: config?.model?.image?.model,
      audio: config?.model?.audio?.model,
      video: config?.model?.video?.model,
    },
    hasCurrentConfig: !!currentConfig,
    rawModelsPreview: models.slice(0, 3).map(m => ({ name: m.model_name, modality: m.modality, provider: m.provider }))
  });

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
