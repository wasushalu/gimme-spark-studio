
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ModelCatalog } from '@/types/database';

export function useModelCatalog() {
  const { data: models = [], isLoading: modelsLoading, error: modelsError } = useQuery({
    queryKey: ['models-for-config'],
    queryFn: async () => {
      console.log('useModelCatalog: Starting to fetch models...');
      
      try {
        const { data, error } = await supabase
          .from('model_catalog')
          .select('*')
          .eq('enabled', true)
          .order('provider', { ascending: true })
          .order('model_name', { ascending: true });
        
        if (error) {
          console.error('useModelCatalog: Database error fetching models:', error);
          throw error;
        }

        console.log('useModelCatalog: Raw models from database:', data);
        console.log('useModelCatalog: Models breakdown:', {
          total: data?.length || 0,
          byModality: {
            text: data?.filter(m => m.modality === 'text').length || 0,
            image: data?.filter(m => m.modality === 'image').length || 0,
            audio: data?.filter(m => m.modality === 'audio').length || 0,
            video: data?.filter(m => m.modality === 'video').length || 0,
          },
          byProvider: data?.reduce((acc, model) => {
            acc[model.provider] = (acc[model.provider] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
          enabledCount: data?.filter(m => m.enabled).length || 0,
          allProviders: [...new Set(data?.map(m => m.provider) || [])],
          allModalities: [...new Set(data?.map(m => m.modality) || [])]
        });
        
        return data as ModelCatalog[];
      } catch (error) {
        console.error('useModelCatalog: Exception while fetching models:', error);
        throw error;
      }
    }
  });

  const getModelsByModality = (modality: string) => {
    const filtered = models.filter(model => model.modality === modality);
    console.log(`useModelCatalog: getModelsByModality(${modality}) returning ${filtered.length} models:`, 
      filtered.map(m => ({ name: m.model_name, provider: m.provider, enabled: m.enabled }))
    );
    return filtered;
  };

  return {
    models,
    modelsLoading,
    modelsError,
    getModelsByModality
  };
}
