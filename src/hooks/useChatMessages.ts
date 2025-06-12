
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, AgentConfigVersion } from '@/types/database';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

export function useChatMessages(
  currentConversationId: string | null,
  user: User | null,
  canUseAgent: boolean
) {
  const queryClient = useQueryClient();

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

  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      content, 
      conversationId, 
      agentType, 
      agentConfig, 
      needsAuth, 
      createConversation 
    }: { 
      content: string; 
      conversationId?: string;
      agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat';
      agentConfig: AgentConfigVersion | null;
      needsAuth: boolean;
      createConversation: () => Promise<{ id: string }>;
    }) => {
      console.log('Sending message:', content);
      
      // Check if agent requires authentication
      if (needsAuth && !user) {
        throw new Error('Please sign in to chat with this agent');
      }

      let activeConversationId = conversationId || currentConversationId;

      // Create conversation if none exists and user is authenticated
      if (!activeConversationId && user) {
        console.log('No conversation exists, creating new one');
        const conversation = await createConversation();
        activeConversationId = conversation.id;
      }

      console.log('Using conversation ID:', activeConversationId);

      // For authenticated users, save user message to database
      let userMessage = null;
      if (user && activeConversationId) {
        const { data: savedMessage, error: userError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: activeConversationId,
            role: 'user',
            content,
          })
          .select()
          .single();

        if (userError) {
          console.error('Error saving user message:', userError);
          throw userError;
        }

        console.log('User message saved:', savedMessage);
        userMessage = savedMessage;
      }

      // Prepare agent config for edge function
      const configToSend = agentConfig?.settings || null;
      console.log('Calling edge function with config:', configToSend);
      
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat', {
        body: {
          conversationId: activeConversationId,
          message: content,
          agentType,
          agentConfig: configToSend,
          isGuest: !user, // Flag for guest users
        },
      });

      if (aiError) {
        console.error('Error from edge function:', aiError);
        throw aiError;
      }

      console.log('AI response received:', aiResponse);

      return { userMessage: userMessage as ChatMessage, aiResponse };
    },
    onSuccess: () => {
      console.log('Message sent successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', currentConversationId] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  return {
    messages: messagesQuery.data || [],
    messagesLoading: messagesQuery.isLoading,
    sendMessageMutation,
  };
}
