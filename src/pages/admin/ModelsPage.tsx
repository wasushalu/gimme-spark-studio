
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ModelCard from '@/components/admin/ModelCard';
import ModelSearch from '@/components/admin/ModelSearch';
import { filterModels } from '@/utils/modelUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'modality' | 'provider' | 'name'>('modality');

  const { data: models, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-models'],
    queryFn: async () => {
      console.log('ModelsPage: Fetching models from model_catalog...');
      const { data, error } = await supabase
        .from('model_catalog')
        .select('*')
        .order('modality', { ascending: true })
        .order('provider', { ascending: true })
        .order('model_name', { ascending: true });
      
      console.log('ModelsPage: Models query result:', { 
        data, 
        error, 
        count: data?.length,
        textModels: data?.filter(m => m.modality === 'text').length || 0,
        imageModels: data?.filter(m => m.modality === 'image').length || 0,
        audioModels: data?.filter(m => m.modality === 'audio').length || 0,
        videoModels: data?.filter(m => m.modality === 'video').length || 0,
        providers: [...new Set(data?.map(m => m.provider) || [])],
        modalities: [...new Set(data?.map(m => m.modality) || [])]
      });
      
      if (error) {
        console.error('ModelsPage: Error fetching models:', error);
        throw error;
      }
      
      console.log(`ModelsPage: Successfully fetched ${data?.length || 0} models`);
      return data as Model[];
    }
  });

  const toggleModelStatus = async (modelId: string, currentStatus: boolean) => {
    try {
      console.log(`ModelsPage: Toggling model ${modelId} from ${currentStatus} to ${!currentStatus}`);
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
      console.error('ModelsPage: Error updating model:', error);
      toast({
        title: 'Error',
        description: 'Failed to update model status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter and sort models
  const filteredAndSortedModels = (() => {
    let filtered = filterModels(models || [], searchTerm);
    
    // Filter by modality
    if (selectedModality !== 'all') {
      filtered = filtered.filter(model => model.modality === selectedModality);
    }
    
    // Sort models
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'modality':
          if (a.modality !== b.modality) return a.modality.localeCompare(b.modality);
          if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
          return a.model_name.localeCompare(b.model_name);
        case 'provider':
          if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
          if (a.modality !== b.modality) return a.modality.localeCompare(b.modality);
          return a.model_name.localeCompare(b.model_name);
        case 'name':
          return a.model_name.localeCompare(b.model_name);
        default:
          return 0;
      }
    });
  })();

  const availableModalities = models ? [...new Set(models.map(m => m.modality))] : [];

  console.log('ModelsPage: Render state:', {
    totalModels: models?.length || 0,
    filteredModels: filteredAndSortedModels?.length || 0,
    searchTerm,
    selectedModality,
    sortBy,
    isLoading,
    error: error?.message,
    providers: models ? [...new Set(models.map(m => m.provider))] : [],
    modalities: availableModalities
  });

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
            {[1, 2, 3, 4, 5].map((i) => (
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
            {filteredAndSortedModels.length} of {models?.length || 0} models
            {models && models.length > 0 && (
              <span className="ml-2">
                ({models.filter(m => m.modality === 'text').length} text, {models.filter(m => m.modality === 'image').length} image, {models.filter(m => m.modality === 'audio').length} audio, {models.filter(m => m.modality === 'video').length} video)
              </span>
            )}
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

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <ModelSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>
        <div className="flex gap-2">
          <Select value={selectedModality} onValueChange={setSelectedModality}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableModalities.map((modality) => (
                <SelectItem key={modality} value={modality}>
                  {modality.charAt(0).toUpperCase() + modality.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: 'modality' | 'provider' | 'name') => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modality">Sort by Type</SelectItem>
              <SelectItem value="provider">Sort by Provider</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats cards for quick overview */}
      {models && models.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{models.length}</div>
              <div className="text-sm text-gray-600">Total Models</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {models.filter(m => m.enabled).length}
              </div>
              <div className="text-sm text-gray-600">Enabled</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {models.filter(m => m.modality === 'text').length}
              </div>
              <div className="text-sm text-gray-600">Text</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {models.filter(m => m.modality === 'image').length}
              </div>
              <div className="text-sm text-gray-600">Image</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-pink-600">
                {models.filter(m => m.modality === 'audio').length}
              </div>
              <div className="text-sm text-gray-600">Audio</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600">
                {models.filter(m => m.modality === 'video').length}
              </div>
              <div className="text-sm text-gray-600">Video</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4">
        {filteredAndSortedModels && filteredAndSortedModels.length > 0 ? (
          filteredAndSortedModels.map((model) => (
            <ModelCard 
              key={model.id} 
              model={model} 
              onToggleStatus={toggleModelStatus}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedModality !== 'all' ? 'No models match your filters' : 'No models found'}
            </div>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedModality !== 'all'
                ? 'Try adjusting your search terms or filters.' 
                : models && models.length === 0 
                  ? 'No models have been added to the catalog yet.'
                  : 'Get started by adding your first model.'
              }
            </p>
            {!searchTerm && selectedModality === 'all' && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Debug information - only show in development or when there are issues */}
      {process.env.NODE_ENV === 'development' && models && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Information</h4>
          <div className="text-xs text-gray-700 space-y-1">
            <p>Total models fetched: {models.length}</p>
            <p>Providers: {[...new Set(models.map(m => m.provider))].join(', ')}</p>
            <p>Modalities: {[...new Set(models.map(m => m.modality))].join(', ')}</p>
            <p>Text models: {models.filter(m => m.modality === 'text').length}</p>
            <p>Image models: {models.filter(m => m.modality === 'image').length}</p>
            <p>Audio models: {models.filter(m => m.modality === 'audio').length}</p>
            <p>Video models: {models.filter(m => m.modality === 'video').length}</p>
            <p>Enabled models: {models.filter(m => m.enabled).length}</p>
            <p>Search term: "{searchTerm}"</p>
            <p>Selected modality: "{selectedModality}"</p>
            <p>Sort by: "{sortBy}"</p>
            <p>Filtered results: {filteredAndSortedModels.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
