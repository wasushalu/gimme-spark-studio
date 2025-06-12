
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  agent_id: string;
  label: string;
  type: 'root' | 'sub' | 'utility';
  visibility: 'public' | 'workspace' | 'internal';
  created_at: string;
}

export function useAgents() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['admin-agents'],
    queryFn: async () => {
      console.log('Fetching agents...');
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Agents query result:', { data, error });
      
      if (error) {
        console.error('Error fetching agents:', error);
        toast({
          title: 'Error loading agents',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      console.log('Successfully fetched agents:', data);
      return data as Agent[];
    }
  });
}
