
import { ModelCatalog } from '@/types/database';

export function createDefaultConfig(models: ModelCatalog[]) {
  // Get the best available models for each modality
  const textModels = models.filter(m => m.modality === 'text' && m.enabled);
  const imageModels = models.filter(m => m.modality === 'image' && m.enabled);
  const audioModels = models.filter(m => m.modality === 'audio' && m.enabled);
  const videoModels = models.filter(m => m.modality === 'video' && m.enabled);

  // Prefer OpenAI models as defaults
  const defaultTextModel = textModels.find(m => m.provider === 'openai') || textModels[0];
  const defaultImageModel = imageModels.find(m => m.provider === 'openai') || imageModels[0];
  const defaultAudioModel = audioModels.find(m => m.provider === 'elevenlabs') || audioModels[0];
  const defaultVideoModel = videoModels.find(m => m.provider === 'openai') || videoModels[0];

  console.log('createDefaultConfig: Creating default config with models:', {
    textModel: defaultTextModel?.model_name,
    imageModel: defaultImageModel?.model_name,
    audioModel: defaultAudioModel?.model_name,
    videoModel: defaultVideoModel?.model_name
  });

  return {
    model: {
      text: {
        provider: defaultTextModel?.provider || 'openai',
        model: defaultTextModel?.model_name || 'gpt-4o-mini'
      },
      image: {
        provider: defaultImageModel?.provider || 'openai',
        model: defaultImageModel?.model_name || 'gpt-image-1'
      },
      audio: {
        provider: defaultAudioModel?.provider || 'elevenlabs',
        model: defaultAudioModel?.model_name || 'eleven_turbo_v2'
      },
      video: {
        provider: defaultVideoModel?.provider || 'openai',
        model: defaultVideoModel?.model_name || 'sora-1.0'
      }
    },
    generation: {
      max_context_tokens: 128000,
      max_response_tokens: 8000,
      temperature: 0.7,
      top_p: 1.0
    },
    prompt: '',
    welcome_message: '',
    tools: ['image_generation'], // Add image generation as default tool
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
      strategy: 'default',
      default_child: null
    }
  };
}
