
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Model {
  id: string;
  modality: 'text' | 'image' | 'audio' | 'video';
  provider: string;
  model_name: string;
  enabled: boolean;
  created_at: string;
}

export default function ModelsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: models, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-models'],
    queryFn: async () => {
      console.log('Fetching models from model_catalog...');
      const { data, error } = await supabase
        .from('model_catalog')
        .select('*')
        .order('provider', { ascending: true });
      
      console.log('Models query result:', { data, error });
      
      if (error) {
        console.error('Error fetching models:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} models`);
      return data as Model[];
    }
  });

  const toggleModelStatus = async (modelId: string, currentStatus: boolean) => {
    try {
      console.log(`Toggling model ${modelId} from ${currentStatus} to ${!currentStatus}`);
      const { error } = await supabase
        .from('model_catalog')
        .update({ enabled: !currentStatus })
        .eq('id', modelId);

      if (error) throw error;

      toast({
        title: 'Model updated',
        description: `Model has been ${!currentStatus ? 'enabled' : 'disabled'}.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating model:', error);
      toast({
        title: 'Error',
        description: 'Failed to update model status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getModalityColor = (modality: string) => {
    switch (modality) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'audio': return 'bg-purple-100 text-purple-800';
      case 'video': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return 'bg-emerald-100 text-emerald-800';
      case 'anthropic': return 'bg-orange-100 text-orange-800';
      case 'google': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter models based on search term
  const filteredModels = models?.filter(model => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      model.model_name.toLowerCase().includes(searchLower) ||
      model.provider.toLowerCase().includes(searchLower) ||
      model.modality.toLowerCase().includes(searchLower)
    );
  }) || [];

  console.log('Filtered models:', filteredModels);
  console.log('Search term:', searchTerm);
  console.log('Total models:', models?.length);

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Model Catalog</h1>
          <Button onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-red-800">
              <h3 className="font-semibold mb-2">Error loading models</h3>
              <p className="text-sm">{error.message}</p>
              <p className="text-xs mt-2 text-red-600">
                Check the console for more details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Catalog</h1>
          <p className="text-sm text-gray-600 mt-1">
            {filteredModels.length} of {models?.length || 0} models
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredModels.map((model) => (
          <Card key={model.id} className="hover:shadow-md transition-shadow">
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
                    onClick={() => toggleModelStatus(model.id, model.enabled)}
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
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No models match your search' : 'No models found'}
          </div>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first model.'}
          </p>
          {!searchTerm && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Model
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
