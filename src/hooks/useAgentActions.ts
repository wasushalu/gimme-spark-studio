
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAgentActions() {
  const { toast } = useToast();

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This will also delete all its configurations.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('agent_id', agentId);

      if (error) throw error;

      toast({
        title: 'Agent deleted',
        description: 'The agent has been successfully deleted.',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete agent. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const createTestAgent = async () => {
    try {
      const testAgent = {
        agent_id: `test-agent-${Date.now()}`,
        label: 'Test Agent',
        type: 'root',
        visibility: 'internal'
      };

      console.log('Creating test agent:', testAgent);
      
      const { data, error } = await supabase
        .from('agents')
        .insert(testAgent)
        .select()
        .single();

      if (error) {
        console.error('Error creating test agent:', error);
        throw error;
      }

      console.log('Test agent created:', data);
      toast({
        title: 'Test agent created',
        description: 'A test agent has been created successfully.',
      });
      
      return true;
    } catch (error) {
      console.error('Error creating test agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test agent. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    deleteAgent,
    createTestAgent
  };
}
