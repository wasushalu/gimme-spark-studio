
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModelCatalog } from '@/types/database';

interface ModelsTabProps {
  config: any;
  setConfig: (config: any) => void;
  models: ModelCatalog[];
  getModelsByModality: (modality: string) => ModelCatalog[];
}

export default function ModelsTab({ config, setConfig, models, getModelsByModality }: ModelsTabProps) {
  // Get current model selections
  const currentTextModel = config?.model?.text?.model || '';
  const currentImageModel = config?.model?.image?.model || '';
  const currentAudioModel = config?.model?.audio?.model || '';
  const currentVideoModel = config?.model?.video?.model || '';
  const currentVisionModel = config?.model?.vision?.model || '';
  
  // Get models by modality
  const textModels = getModelsByModality('text');
  const imageModels = getModelsByModality('image');
  const audioModels = getModelsByModality('audio');
  const videoModels = getModelsByModality('video');

  console.log('ModelsTab: Component state:', {
    totalModels: models.length,
    textModels: textModels.length,
    imageModels: imageModels.length,
    audioModels: audioModels.length,
    videoModels: videoModels.length,
    currentTextModel,
    currentImageModel,
    currentAudioModel,
    currentVideoModel,
    currentVisionModel,
    allModels: models.map(m => ({ id: m.id, name: m.model_name, modality: m.modality, provider: m.provider }))
  });

  const updateTextModel = (modelName: string) => {
    const selectedModel = textModels.find(m => m.model_name === modelName);
    console.log('ModelsTab: Updating text model:', { modelName, selectedModel });
    
    setConfig(prev => ({
      ...prev,
      model: {
        ...prev.model,
        text: {
          provider: selectedModel?.provider || 'openai',
          model: modelName
        }
      }
    }));
  };

  const updateImageModel = (modelName: string) => {
    const selectedModel = imageModels.find(m => m.model_name === modelName);
    console.log('ModelsTab: Updating image model:', { modelName, selectedModel });
    
    setConfig(prev => ({
      ...prev,
      model: {
        ...prev.model,
        image: {
          provider: selectedModel?.provider || 'openai',
          model: modelName
        }
      }
    }));
  };

  const updateAudioModel = (modelName: string) => {
    const selectedModel = audioModels.find(m => m.model_name === modelName);
    console.log('ModelsTab: Updating audio model:', { modelName, selectedModel });
    
    setConfig(prev => ({
      ...prev,
      model: {
        ...prev.model,
        audio: {
          provider: selectedModel?.provider || 'elevenlabs',
          model: modelName
        }
      }
    }));
  };

  const updateVideoModel = (modelName: string) => {
    const selectedModel = videoModels.find(m => m.model_name === modelName);
    console.log('ModelsTab: Updating video model:', { modelName, selectedModel });
    
    setConfig(prev => ({
      ...prev,
      model: {
        ...prev.model,
        video: {
          provider: selectedModel?.provider || 'openai',
          model: modelName
        }
      }
    }));
  };

  const updateVisionModel = (modelName: string) => {
    const selectedModel = imageModels.find(m => m.model_name === modelName);
    console.log('ModelsTab: Updating vision model:', { modelName, selectedModel });
    
    setConfig(prev => ({
      ...prev,
      model: {
        ...prev.model,
        vision: {
          provider: selectedModel?.provider || 'openai',
          model: modelName
        }
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="text-model">Text Model</Label>
          <Select
            value={currentTextModel}
            onValueChange={updateTextModel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select text model" />
            </SelectTrigger>
            <SelectContent>
              {textModels.length > 0 ? (
                textModels.map((model) => (
                  <SelectItem key={`text-${model.id}`} value={model.model_name}>
                    {model.provider} - {model.model_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-models" disabled>
                  No text models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {textModels.length} text model{textModels.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-model">Image Generation</Label>
          <Select
            value={currentImageModel}
            onValueChange={updateImageModel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select image model" />
            </SelectTrigger>
            <SelectContent>
              {imageModels.filter(m => m.model_name.includes('dall-e') || m.model_name.includes('midjourney') || m.model_name.includes('stable-diffusion')).length > 0 ? (
                imageModels.filter(m => m.model_name.includes('dall-e') || m.model_name.includes('midjourney') || m.model_name.includes('stable-diffusion')).map((model) => (
                  <SelectItem key={`image-${model.id}`} value={model.model_name}>
                    {model.provider} - {model.model_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-models" disabled>
                  No image generation models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            For creating images and artwork
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vision-model">Visual Recognition</Label>
          <Select
            value={currentVisionModel}
            onValueChange={updateVisionModel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vision model" />
            </SelectTrigger>
            <SelectContent>
              {imageModels.filter(m => m.model_name.includes('gpt-4') || m.model_name.includes('gemini') || m.model_name.includes('claude')).length > 0 ? (
                imageModels.filter(m => m.model_name.includes('gpt-4') || m.model_name.includes('gemini') || m.model_name.includes('claude')).map((model) => (
                  <SelectItem key={`vision-${model.id}`} value={model.model_name}>
                    {model.provider} - {model.model_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-models" disabled>
                  No vision models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            For analyzing and understanding images
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audio-model">Audio/Voice Model</Label>
          <Select
            value={currentAudioModel}
            onValueChange={updateAudioModel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select audio model" />
            </SelectTrigger>
            <SelectContent>
              {audioModels.length > 0 ? (
                audioModels.map((model) => (
                  <SelectItem key={`audio-${model.id}`} value={model.model_name}>
                    {model.provider} - {model.model_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-models" disabled>
                  No audio models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {audioModels.length} audio model{audioModels.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-model">Video Model</Label>
          <Select
            value={currentVideoModel}
            onValueChange={updateVideoModel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select video model" />
            </SelectTrigger>
            <SelectContent>
              {videoModels.length > 0 ? (
                videoModels.map((model) => (
                  <SelectItem key={`video-${model.id}`} value={model.model_name}>
                    {model.provider} - {model.model_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-models" disabled>
                  No video models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {videoModels.length} video model{videoModels.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Enhanced debug information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Model Configuration Status</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p><strong>Total models loaded:</strong> {models.length}</p>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p><strong>Text models ({textModels.length}):</strong></p>
              <ul className="ml-2 list-disc max-h-20 overflow-y-auto">
                {textModels.slice(0, 5).map(m => <li key={m.id}>{m.provider}/{m.model_name}</li>)}
                {textModels.length > 5 && <li>... and {textModels.length - 5} more</li>}
              </ul>
            </div>
            <div>
              <p><strong>Image models ({imageModels.length}):</strong></p>
              <ul className="ml-2 list-disc max-h-20 overflow-y-auto">
                {imageModels.slice(0, 5).map(m => <li key={m.id}>{m.provider}/{m.model_name}</li>)}
                {imageModels.length > 5 && <li>... and {imageModels.length - 5} more</li>}
              </ul>
            </div>
            <div>
              <p><strong>Audio models ({audioModels.length}):</strong></p>
              <ul className="ml-2 list-disc max-h-20 overflow-y-auto">
                {audioModels.slice(0, 5).map(m => <li key={m.id}>{m.provider}/{m.model_name}</li>)}
                {audioModels.length > 5 && <li>... and {audioModels.length - 5} more</li>}
              </ul>
            </div>
            <div>
              <p><strong>Video models ({videoModels.length}):</strong></p>
              <ul className="ml-2 list-disc max-h-20 overflow-y-auto">
                {videoModels.slice(0, 5).map(m => <li key={m.id}>{m.provider}/{m.model_name}</li>)}
                {videoModels.length > 5 && <li>... and {videoModels.length - 5} more</li>}
              </ul>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p><strong>Current selections:</strong></p>
            <p>Text: {currentTextModel || 'None'}</p>
            <p>Image Generation: {currentImageModel || 'None'}</p>
            <p>Visual Recognition: {currentVisionModel || 'None'}</p>
            <p>Audio: {currentAudioModel || 'None'}</p>
            <p>Video: {currentVideoModel || 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
