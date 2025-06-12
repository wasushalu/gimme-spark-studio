
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatConversation } from '@/types/database';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

export function useChatConversation(
  agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat',
  user: User | null,
  setCurrentConversationId: (id: string | null) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, workspaceId }: { title?: string; workspaceId?: string }) => {
      if (!user) throw new Error('User must be authenticated');

      console.log('Creating conversation for user:', user.id, 'agent:', agentType);

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          agent_type: agentType,
          title: title || `New ${agentType} conversation`,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      
      console.log('Created conversation:', data);
      return data as ChatConversation;
    },
    onSuccess: (conversation) => {
      setCurrentConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to start conversation');
    }
  });
}
