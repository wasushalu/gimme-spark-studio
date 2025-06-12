
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
  
  // Get models by modality
  const textModels = getModelsByModality('text');
  const imageModels = getModelsByModality('image');

  console.log('ModelsTab: Component state:', {
    totalModels: models.length,
    textModels: textModels.length,
    imageModels: imageModels.length,
    currentTextModel,
    currentImageModel,
    textModelsList: textModels.map(m => m.model_name),
    imageModelsList: imageModels.map(m => m.model_name)
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
      </div>

      {/* Debug information */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Debug Information</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p>Total models in catalog: {models.length}</p>
          <p>Text models: {textModels.length} ({textModels.map(m => m.model_name).join(', ')})</p>
          <p>Image models: {imageModels.length} ({imageModels.map(m => m.model_name).join(', ')})</p>
          <p>Current selections: Text={currentTextModel}, Image={currentImageModel}</p>
        </div>
      </div>

      {/* All models list for verification */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">All Available Models</h4>
        <div className="text-xs space-y-1">
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
