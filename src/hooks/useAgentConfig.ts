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
      // Ensure all required fields are preserved
      const updatedConfig = {
        ...currentConfig.settings,
        prompt: currentConfig.settings.prompt || '',
        welcome_message: currentConfig.settings.welcome_message || ''
      };
      setConfig(updatedConfig);
    } else if (models.length > 0 && !currentConfig) {
      console.log('useAgentConfig: Creating default config from available models');
      setConfig(createDefaultConfig(models));
    }
  }, [currentConfig, models]);

  // Auto-create default config for agents without configuration
  useEffect(() => {
    if (agent && models.length > 0 && !currentConfig && !modelsLoading) {
      console.log('useAgentConfig: Auto-creating default configuration for agent:', agent.agent_id);
      const defaultConfig = createDefaultConfig(models);
      
      // Set agent-specific prompts and welcome messages
      const agentSpecificConfig = {
        ...defaultConfig,
        prompt: getDefaultPromptForAgent(agent.agent_id),
        welcome_message: getDefaultWelcomeMessageForAgent(agent.agent_id)
      };
      
      // Auto-save the default configuration
      saveConfigMutation.mutate(agentSpecificConfig);
    }
  }, [agent, models, currentConfig, modelsLoading, saveConfigMutation]);

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

function getDefaultPromptForAgent(agentId: string): string {
  switch (agentId) {
    case 'gimmebot':
      return `You are gimmebot, the friendly AI marketing assistant at gimmefy.ai. You're knowledgeable about marketing strategies, content creation, social media best practices, brand positioning, and digital marketing trends. 

Your role is to:
- Help users understand marketing concepts and strategies
- Provide practical marketing advice and tips
- Answer questions about gimmefy's platform and features
- Guide users toward the right tools and resources
- Maintain a helpful, enthusiastic, and approachable tone

You have access to advanced AI capabilities including:
- Text generation and analysis
- Image creation and visual recognition
- Audio/voice synthesis
- Video content analysis and generation

Always be supportive and encouraging. If you don't know something specific about gimmefy's features, acknowledge it and suggest they explore the platform or contact support. Keep your responses practical and actionable.`;

    case 'studio':
      return `You are the Studio AI assistant, a creative hub for content generation and brand development. You specialize in helping users create compelling marketing content, visual concepts, and creative strategies.

Your role is to:
- Assist with creative content development and ideation
- Help generate copy, headlines, and marketing messages
- Provide creative direction for visual content
- Support brand storytelling and positioning
- Collaborate on campaign concepts and creative briefs
- Analyze and enhance visual content

You have access to advanced AI tools for:
- Text and copy generation
- Image creation and visual analysis
- Audio content creation
- Video content generation and analysis

You can process images users share, generate new visuals, create audio content, and even work with video materials. Be creative, inspiring, and detail-oriented in your assistance. Focus on producing high-quality, brand-aligned content that resonates with target audiences.`;

    case 'neutral_chat':
      return `You are Jack, a helpful and knowledgeable AI assistant. You provide clear, informative responses across a wide range of topics while maintaining a friendly and professional demeanor.

Your approach is:
- Balanced and objective in your responses
- Helpful without being overly promotional
- Knowledgeable across various subjects
- Clear and concise in your communication
- Professional yet approachable

You have multimodal capabilities including:
- Text analysis and generation
- Image understanding and creation
- Audio processing
- Video analysis

You can discuss topics beyond marketing, analyze images users share, help with visual content, and provide assistance across multiple media types. When relevant, you can mention gimmefy's capabilities, but focus primarily on providing valuable assistance to the user.`;

    default:
      return '';
  }
}

function getDefaultWelcomeMessageForAgent(agentId: string): string {
  switch (agentId) {
    case 'gimmebot':
      return "Hello there! 🤔 I'm gimmebot, your friendly marketing guide here at gimmefy.ai. I'm here to help you navigate the world of marketing, answer questions about gimmefy's features, and point you toward exactly what you need. Whether you're exploring content strategies, curious about our platform, or just want some marketing wisdom—I'm all ears! I can also help with visual content, analyze images, and even assist with video and audio content. What brings you here today?";

    case 'studio':
      return "Welcome to Studio! 🎨 I'm your creative AI assistant, ready to help you bring your marketing ideas to life. Whether you need compelling copy, creative concepts, strategic content direction, or want to work with images, audio, and video content, I'm here to collaborate with you. Share any visuals you'd like me to analyze, and I can help create, enhance, or provide feedback on your creative assets. Let's create something amazing together! What creative challenge can I help you tackle today?";

    case 'neutral_chat':
      return "Hi there! I'm Jack, your helpful AI assistant. I'm here to provide clear, informative assistance across a wide range of topics. I can work with text, images, audio, and video content to help you with whatever you need. Feel free to share any files or media you'd like me to analyze or help you work with. Whether you have questions, need advice, or want to explore ideas, I'm ready to help. What can I assist you with today?";

    default:
      return "Hello! How can I assist you today?";
  }
}
