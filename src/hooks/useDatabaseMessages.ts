
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/database';
import type { User } from '@supabase/supabase-js';

export function useDatabaseMessages(
  currentConversationId: string | null,
  user: User | null,
  canUseAgent: boolean
) {
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', currentConversationId],
    queryFn: async () => {
      if (!currentConversationId || !user) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
      return data as ChatMessage[];
    },
    enabled: !!currentConversationId && !!user && canUseAgent,
    staleTime: 1000, // 1 second - messages should be fresh
  });

  return {
    messages: messagesQuery.data || [],
    messagesLoading: messagesQuery.isLoading,
  };
}
