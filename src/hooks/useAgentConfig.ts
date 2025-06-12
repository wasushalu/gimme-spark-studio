
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agent, AgentConfigVersion } from '@/types/database';
import { useModelCatalog } from './useModelCatalog';
import { useAgentConfigMutations } from './useAgentConfigMutations';
import { createDefaultConfig } from '@/utils/agentConfigDefaults';

export function useAgentConfig(agent: Agent | null) {
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

  // Get model catalog data
  const { models, modelsLoading, modelsError, getModelsByModality } = useModelCatalog();

  // Get mutation handlers
  const { saveConfigMutation } = useAgentConfigMutations(agent, currentConfig);

  // Initialize config state
  const [config, setConfig] = useState(() => createDefaultConfig([]));

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
      setConfig(createDefaultConfig(models));
    }
  }, [currentConfig, models]);

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
