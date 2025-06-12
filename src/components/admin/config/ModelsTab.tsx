
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
    currentConfig: config?.model
  });

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          Debug: Total models: {models.length} | 
          Text: {getModelsByModality('text').length} | 
          Image: {getModelsByModality('image').length}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="text-model">Text Model</Label>
          <Select
            value={config.model.text.model}
            onValueChange={(value) => {
              const selectedModel = models.find(m => m.model_name === value && m.modality === 'text');
              console.log('ModelsTab: Selected text model:', selectedModel);
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
              {getModelsByModality('text').map((model) => (
                <SelectItem key={model.id} value={model.model_name}>
                  {model.provider} - {model.model_name}
                </SelectItem>
              ))}
              {getModelsByModality('text').length === 0 && (
                <SelectItem value="no-models" disabled>
                  No text models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {getModelsByModality('text').length} text models available
          </p>
        </div>

        <div>
          <Label htmlFor="image-model">Image Model</Label>
          <Select
            value={config.model.image.model}
            onValueChange={(value) => {
              const selectedModel = models.find(m => m.model_name === value && m.modality === 'image');
              console.log('ModelsTab: Selected image model:', selectedModel);
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
              {getModelsByModality('image').map((model) => (
                <SelectItem key={model.id} value={model.model_name}>
                  {model.provider} - {model.model_name}
                </SelectItem>
              ))}
              {getModelsByModality('image').length === 0 && (
                <SelectItem value="no-models" disabled>
                  No image models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {getModelsByModality('image').length} image models available
          </p>
        </div>
      </div>
    </div>
  );
}
