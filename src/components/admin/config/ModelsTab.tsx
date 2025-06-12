
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
    textModelsList: textModels.map(m => m.model_name),
    imageModelsList: imageModels.map(m => m.model_name),
    audioModelsList: audioModels.map(m => m.model_name),
    videoModelsList: videoModels.map(m => m.model_name)
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <Label htmlFor="image-model">Image Model</Label>
          <Select
            value={currentImageModel}
            onValueChange={updateImageModel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select image model" />
            </SelectTrigger>
            <SelectContent>
              {imageModels.length > 0 ? (
                imageModels.map((model) => (
                  <SelectItem key={`image-${model.id}`} value={model.model_name}>
                    {model.provider} - {model.model_name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-models" disabled>
                  No image models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {imageModels.length} image model{imageModels.length !== 1 ? 's' : ''} available
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

      {/* Debug information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Debug Information</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p>Total models in catalog: {models.length}</p>
          <p>Text models: {textModels.length} ({textModels.map(m => m.model_name).join(', ')})</p>
          <p>Image models: {imageModels.length} ({imageModels.map(m => m.model_name).join(', ')})</p>
          <p>Audio models: {audioModels.length} ({audioModels.map(m => m.model_name).join(', ')})</p>
          <p>Video models: {videoModels.length} ({videoModels.map(m => m.model_name).join(', ')})</p>
          <p>Current selections: Text={currentTextModel}, Image={currentImageModel}, Audio={currentAudioModel}, Video={currentVideoModel}</p>
        </div>
      </div>

      {/* All models list for verification */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">All Available Models</h4>
        <div className="text-xs space-y-1 max-h-60 overflow-y-auto">
          {models.map((model) => (
            <div key={model.id} className="flex justify-between items-center">
              <span>{model.provider} - {model.model_name}</span>
              <span className="text-gray-500 px-2 py-1 bg-white rounded text-xs">
                {model.modality}
              </span>
            </div>
          ))}
          {models.length === 0 && (
            <p className="text-gray-500">No models found in the catalog</p>
          )}
        </div>
      </div>
    </div>
  );
}
