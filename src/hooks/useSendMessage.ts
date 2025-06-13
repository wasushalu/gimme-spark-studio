
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AgentConfigVersion } from '@/types/database';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { LocalMessage } from './useGuestMessages';

interface SendMessageParams {
  content: string;
  conversationId?: string;
  agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio';
  agentConfig: AgentConfigVersion | null;
  needsAuth: boolean;
  createConversation: () => Promise<{ id: string }>;
}

export function useSendMessage(
  currentConversationId: string | null,
  user: User | null,
  addGuestMessage: (message: LocalMessage) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      conversationId,
      agentType,
      agentConfig,
      needsAuth,
      createConversation
    }: SendMessageParams) => {
      console.log('=== ISOLATED MESSAGE SEND START ===');
      console.log('Sending message for isolated agent:', agentType);
      console.log('Message content:', content);
      console.log('Is guest user:', !user);
      
      if (needsAuth && !user) {
        throw new Error('Please sign in to chat with this agent');
      }

      let activeConversationId = conversationId || currentConversationId;

      if (!activeConversationId && user) {
        console.log('Creating new isolated conversation for agent:', agentType);
        const conversation = await createConversation();
        activeConversationId = conversation.id;
      }

      console.log('Using isolated conversation ID for agent', agentType, ':', activeConversationId);

      // For guest users, add user message to isolated local state
      if (!user) {
        const userMessage: LocalMessage = {
          id: `temp-user-${agentType}-${Date.now()}`, // Include agent type in ID for isolation
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };
        console.log('Adding user message to isolated guest state for agent', agentType, ':', userMessage);
        addGuestMessage(userMessage);
      }

      // For authenticated users, save user message to database
      let userMessage = null;
      if (user && activeConversationId) {
        console.log('Saving user message to database for agent:', agentType);
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
          console.error('Error saving user message for agent', agentType, ':', userError);
          throw userError;
        }

        console.log('User message saved for agent', agentType, ':', savedMessage);
        userMessage = savedMessage;
      }

      // Prepare agent config for edge function
      const configToSend = agentConfig?.settings || null;
      console.log('Calling edge function for agent', agentType, 'with config:', configToSend);
      
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat', {
        body: {
          conversationId: activeConversationId,
          message: content,
          agentType,
          agentConfig: configToSend,
          isGuest: !user,
        },
      });

      if (aiError) {
        console.error('=== EDGE FUNCTION ERROR FOR AGENT', agentType, '===');
        console.error('Error from edge function:', aiError);
        throw aiError;
      }

      console.log('=== EDGE FUNCTION SUCCESS FOR AGENT', agentType, '===');
      console.log('AI response received for agent', agentType, ':', aiResponse);

      if (!aiResponse || !aiResponse.response) {
        console.error('=== INVALID AI RESPONSE FOR AGENT', agentType, '===');
        throw new Error(`Invalid response from AI service for agent ${agentType}`);
      }

      // For guest users, add AI response to isolated local state
      if (!user) {
        const aiMessage: LocalMessage = {
          id: `temp-ai-${agentType}-${Date.now()}`, // Include agent type in ID for isolation
          role: 'assistant',
          content: aiResponse.response,
          created_at: new Date().toISOString(),
        };
        console.log('Adding AI message to isolated guest state for agent', agentType, ':', aiMessage);
        addGuestMessage(aiMessage);
      }

      console.log('=== ISOLATED MESSAGE SEND SUCCESS FOR AGENT', agentType, '===');

      return { userMessage, aiResponse };
    },
    onSuccess: (data, variables) => {
      console.log('=== MUTATION SUCCESS FOR AGENT', variables.agentType, '===');
      
      // Only invalidate queries for authenticated users
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', currentConversationId] });
      }
    },
    onError: (error, variables) => {
      console.error('=== MUTATION ERROR FOR AGENT', variables.agentType, '===');
      console.error('Failed to send message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}
