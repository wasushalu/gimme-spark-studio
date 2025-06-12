
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, AgentConfigVersion } from '@/types/database';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { useState, useCallback } from 'react';

// Local message type for guest users
interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  conversation_id?: string;
}

export function useChatMessages(
  currentConversationId: string | null,
  user: User | null,
  canUseAgent: boolean
) {
  const queryClient = useQueryClient();
  
  // Local state for guest user messages
  const [guestMessages, setGuestMessages] = useState<LocalMessage[]>([]);

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

  // Return database messages for authenticated users
  const messages = messagesQuery.data || [];

  const addGuestMessage = useCallback((message: LocalMessage) => {
    console.log('=== ADDING GUEST MESSAGE ===');
    console.log('Message to add:', message);
    setGuestMessages(prev => {
      const updated = [...prev, message];
      console.log('Updated guest messages:', updated);
      return updated;
    });
  }, []);

  const clearGuestMessages = useCallback(() => {
    console.log('=== CLEARING GUEST MESSAGES ===');
    setGuestMessages([]);
  }, []);

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
      agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio';
      agentConfig: AgentConfigVersion | null;
      needsAuth: boolean;
      createConversation: () => Promise<{ id: string }>;
    }) => {
      console.log('=== FRONTEND MESSAGE SEND START ===');
      console.log('Sending message:', content);
      console.log('Is guest user:', !user);
      
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

      // For guest users, add user message to local state immediately
      if (!user) {
        const userMessage: LocalMessage = {
          id: `temp-user-${Date.now()}`,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };
        console.log('Adding user message to guest state:', userMessage);
        addGuestMessage(userMessage);
      }

      // For authenticated users, save user message to database
      let userMessage = null;
      if (user && activeConversationId) {
        console.log('Saving user message to database...');
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
        console.error('=== EDGE FUNCTION ERROR ===');
        console.error('Error from edge function:', aiError);
        throw aiError;
      }

      console.log('=== EDGE FUNCTION SUCCESS ===');
      console.log('AI response received from edge function:', aiResponse);

      if (!aiResponse || !aiResponse.response) {
        console.error('=== INVALID AI RESPONSE ===');
        console.error('AI response is missing or invalid:', aiResponse);
        throw new Error('Invalid response from AI service');
      }

      // For guest users, add AI response to local state immediately
      if (!user) {
        const aiMessage: LocalMessage = {
          id: `temp-ai-${Date.now()}`,
          role: 'assistant',
          content: aiResponse.response,
          created_at: new Date().toISOString(),
        };
        console.log('Adding AI message to guest state:', aiMessage);
        addGuestMessage(aiMessage);
      }

      console.log('=== FRONTEND MESSAGE SEND SUCCESS ===');
      console.log('Final AI response content:', aiResponse.response);

      return { userMessage: userMessage as ChatMessage, aiResponse };
    },
    onSuccess: (data) => {
      console.log('=== MUTATION SUCCESS ===');
      console.log('Message sent successfully');
      console.log('Success data:', data);
      
      // Only invalidate queries for authenticated users
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', currentConversationId] });
      }
    },
    onError: (error) => {
      console.error('=== MUTATION ERROR ===');
      console.error('Failed to send message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  return {
    messages, // Database messages (for authenticated users)
    guestMessages, // Local messages (for guest users)
    messagesLoading: messagesQuery.isLoading,
    sendMessageMutation,
    clearGuestMessages,
  };
}
