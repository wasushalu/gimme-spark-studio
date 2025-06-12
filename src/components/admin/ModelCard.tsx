
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { getModalityColor, getProviderColor } from '@/utils/modelUtils';

interface Model {
  id: string;
  modality: 'text' | 'image' | 'audio' | 'video';
  provider: string;
  model_name: string;
  enabled: boolean;
  created_at: string;
}

interface ModelCardProps {
  model: Model;
  onToggleStatus: (modelId: string, currentStatus: boolean) => void;
}

export default function ModelCard({ model, onToggleStatus }: ModelCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{model.model_name}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge className={getProviderColor(model.provider)}>
            {model.provider}
          </Badge>
          <Badge className={getModalityColor(model.modality)}>
            {model.modality}
          </Badge>
          <Badge variant={model.enabled ? 'default' : 'secondary'}>
            {model.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Provider: <span className="font-medium">{model.provider}</span>
            </p>
            <p className="text-sm text-gray-500">
              Added: {new Date(model.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(model.id, model.enabled)}
            >
              {model.enabled ? 'Disable' : 'Enable'}
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
