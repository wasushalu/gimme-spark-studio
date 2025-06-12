
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
  console.log('ModelsTab: Render with props:', {
    totalModels: models.length,
    textModels: getModelsByModality('text').length,
    imageModels: getModelsByModality('image').length,
    currentConfig: config?.model,
    configExists: !!config
  });

  // Ensure config has the proper structure
  const currentTextModel = config?.model?.text?.model || '';
  const currentImageModel = config?.model?.image?.model || '';
  
  console.log('ModelsTab: Current selections:', {
    textModel: currentTextModel,
    imageModel: currentImageModel
  });

  const textModels = getModelsByModality('text');
  const imageModels = getModelsByModality('image');

  console.log('ModelsTab: Available models breakdown:', {
    textModels: textModels.map(m => ({ name: m.model_name, provider: m.provider })),
    imageModels: imageModels.map(m => ({ name: m.model_name, provider: m.provider }))
  });

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          Debug: Total models: {models.length} | 
          Text: {textModels.length} | 
          Image: {imageModels.length}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Current: Text={currentTextModel} | Image={currentImageModel}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="text-model">Text Model</Label>
          <Select
            value={currentTextModel}
            onValueChange={(value) => {
              const selectedModel = models.find(m => m.model_name === value && m.modality === 'text');
              console.log('ModelsTab: Selected text model:', { value, selectedModel });
              setConfig(prev => ({
                ...prev,
                model: {
                  ...prev.model,
                  text: {
                    provider: selectedModel?.provider || 'openai',
                    model: value
                  }
                }
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select text model" />
            </SelectTrigger>
            <SelectContent>
              {textModels.map((model) => (
                <SelectItem key={`text-${model.id}`} value={model.model_name}>
                  {model.provider} - {model.model_name}
                </SelectItem>
              ))}
              {textModels.length === 0 && (
                <SelectItem value="no-models" disabled>
                  No text models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {textModels.length} text models available
          </p>
        </div>

        <div>
          <Label htmlFor="image-model">Image Model</Label>
          <Select
            value={currentImageModel}
            onValueChange={(value) => {
              const selectedModel = models.find(m => m.model_name === value && m.modality === 'image');
              console.log('ModelsTab: Selected image model:', { value, selectedModel });
              setConfig(prev => ({
                ...prev,
                model: {
                  ...prev.model,
                  image: {
                    provider: selectedModel?.provider || 'openai',
                    model: value
                  }
                }
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select image model" />
            </SelectTrigger>
            <SelectContent>
              {imageModels.map((model) => (
                <SelectItem key={`image-${model.id}`} value={model.model_name}>
                  {model.provider} - {model.model_name}
                </SelectItem>
              ))}
              {imageModels.length === 0 && (
                <SelectItem value="no-models" disabled>
                  No image models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {imageModels.length} image models available
          </p>
        </div>
      </div>

      {/* Show all available models for debugging */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">All Available Models (Debug):</h4>
        <div className="text-xs space-y-1">
          {models.map((model) => (
            <div key={model.id} className="flex justify-between">
              <span>{model.provider} - {model.model_name}</span>
              <span className="text-gray-500">({model.modality})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
