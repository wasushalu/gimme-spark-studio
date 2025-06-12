
import { ModelCatalog } from '@/types/database';

export function createDefaultConfig(models: ModelCatalog[]) {
  console.log('createDefaultConfig: Creating default config with models:', {
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

  console.log('createDefaultConfig: Created default config:', defaultConfig);
  return defaultConfig;
}
