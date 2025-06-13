
import { ModelCatalog } from '@/types/database';

export function createDefaultConfig(models: ModelCatalog[]) {
  // Get default models for each modality
  const textModels = models.filter(m => m.modality === 'text');
  const imageModels = models.filter(m => m.modality === 'image');
  const audioModels = models.filter(m => m.modality === 'audio');
  const videoModels = models.filter(m => m.modality === 'video');

  // Find preferred default models
  const defaultTextModel = textModels.find(m => m.provider === 'openai' && m.model_name === 'gpt-4o') || textModels[0];
  const defaultImageModel = imageModels.find(m => m.provider === 'openai' && m.model_name === 'dall-e-3') || imageModels[0];
  const defaultAudioModel = audioModels.find(m => m.provider === 'elevenlabs') || audioModels[0];
  const defaultVideoModel = videoModels.find(m => m.provider === 'openai' && m.model_name === 'sora') || videoModels[0];
  const defaultVisionModel = imageModels.find(m => m.provider === 'openai' && m.model_name === 'gpt-4o') || imageModels[0];

  return {
    model: {
      text: {
        provider: defaultTextModel?.provider || 'openai',
        model: defaultTextModel?.model_name || 'gpt-4o'
      },
      image: {
        provider: defaultImageModel?.provider || 'openai',
        model: defaultImageModel?.model_name || 'dall-e-3'
      },
      audio: {
        provider: defaultAudioModel?.provider || 'elevenlabs',
        model: defaultAudioModel?.model_name || 'eleven_turbo_v2'
      },
      video: {
        provider: defaultVideoModel?.provider || 'openai',
        model: defaultVideoModel?.model_name || 'sora'
      },
      vision: {
        provider: defaultVisionModel?.provider || 'openai',
        model: defaultVisionModel?.model_name || 'gpt-4o'
      }
    },
    generation: {
      max_context_tokens: 128000,
      max_response_tokens: 4000,
      temperature: 0.7,
      top_p: 1.0
    },
    prompt: '',
    welcome_message: '',
    tools: [],
    knowledge_base: {
      enabled: false,
      vector_store_id: null,
      chunk_size: 1000,
      chunk_overlap: 200,
      retrieval_depth: 5,
      keyword_extraction: 'auto'
    },
    agent_as_tool: {
      expose: false,
      function_name: '',
      signature: {}
    },
    router: {
      strategy: 'single',
      default_child: null
    }
  };
}
