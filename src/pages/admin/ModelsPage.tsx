
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ModelCard from '@/components/admin/ModelCard';
import { filterModels } from '@/utils/modelUtils';

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
  const [sortBy, setSortBy] = useState<'name' | 'provider' | 'modality' | 'created_at'>('name');
  const [filterModality, setFilterModality] = useState<'all' | 'text' | 'image' | 'audio' | 'video'>('all');

  const { data: models, isLoading, refetch } = useQuery({
    queryKey: ['admin-models'],
    queryFn: async () => {
      console.log('Fetching models...');
      const { data, error } = await supabase
        .from('model_catalog')
        .select('*')
        .order('model_name', { ascending: true });
      
      console.log('Models query result:', { data, error });
      
      if (error) {
        console.error('Error fetching models:', error);
        throw error;
      }
      
      console.log('Successfully fetched models:', data);
      return data as Model[];
    }
  });

  const toggleModelStatus = async (modelId: string, currentStatus: boolean) => {
    try {
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

  // Filter and sort models
  const processedModels = models ? (() => {
    // First filter by search term
    let filtered = filterModels(models, searchTerm);
    
    // Then filter by modality if not 'all'
    if (filterModality !== 'all') {
      filtered = filtered.filter(model => model.modality === filterModality);
    }
    
    // Then sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.model_name.localeCompare(b.model_name);
        case 'provider':
          return a.provider.localeCompare(b.provider);
        case 'modality':
          return a.modality.localeCompare(b.modality);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
    
    return filtered;
  })() : [];

  // Get counts for each modality
  const modalityCounts = models ? {
    text: models.filter(m => m.modality === 'text').length,
    image: models.filter(m => m.modality === 'image').length,
    audio: models.filter(m => m.modality === 'audio').length,
    video: models.filter(m => m.modality === 'video').length,
  } : { text: 0, image: 0, audio: 0, video: 0 };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering ModelsPage with:', {
    totalModels: models?.length,
    processedModels: processedModels.length,
    modalityCounts,
    filterModality,
    searchTerm
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Model Catalog</h1>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline">Total: {models?.length || 0}</Badge>
            <Badge variant="outline">Text: {modalityCounts.text}</Badge>
            <Badge variant="outline">Image: {modalityCounts.image}</Badge>
            <Badge variant="outline">Audio: {modalityCounts.audio}</Badge>
            <Badge variant="outline">Video: {modalityCounts.video}</Badge>
          </div>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Model
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search models by name, provider, or modality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterModality} onValueChange={(value: any) => setFilterModality(value)}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types ({models?.length || 0})</SelectItem>
            <SelectItem value="text">Text ({modalityCounts.text})</SelectItem>
            <SelectItem value="image">Image ({modalityCounts.image})</SelectItem>
            <SelectItem value="audio">Audio ({modalityCounts.audio})</SelectItem>
            <SelectItem value="video">Video ({modalityCounts.video})</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="provider">Sort by Provider</SelectItem>
            <SelectItem value="modality">Sort by Type</SelectItem>
            <SelectItem value="created_at">Sort by Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {processedModels.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            onToggleStatus={toggleModelStatus}
          />
        ))}
      </div>

      {processedModels.length === 0 && (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterModality !== 'all' ? 'No models match your filters' : 'No models found'}
          </div>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterModality !== 'all' 
              ? 'Try adjusting your search terms or filters.' 
              : 'Get started by adding your first model.'}
          </p>
          {(!searchTerm && filterModality === 'all') && (
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
