
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useChatAuth } from './useChatAuth';
import { useChatConfig } from './useChatConfig';
import { useChatMessages } from './useChatMessages';
import { useChatConversation } from './useChatConversation';

export function useChat(agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat', requireAuth = false) {
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Use smaller hooks
  const { needsAuth, canUseAgent, user } = useChatAuth(agentType);
  
  const { data: agentConfig, isLoading: configLoading } = useChatConfig(agentType, canUseAgent);
  
  const { messages, messagesLoading, sendMessageMutation, clearGuestMessages } = useChatMessages(
    currentConversationId,
    user,
    canUseAgent
  );
  
  const createConversationMutation = useChatConversation(
    agentType,
    user,
    setCurrentConversationId
  );

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    queryClient.removeQueries({ queryKey: ['chat-messages'] });
    
    // Clear guest messages when starting new conversation
    if (!user && clearGuestMessages) {
      clearGuestMessages();
    }
  }, [queryClient, user, clearGuestMessages]);

  const sendMessage = useCallback(async ({ content }: { content: string }) => {
    if (!content.trim()) return;
    
    // Check if agent requires authentication before proceeding
    if (needsAuth && !user) {
      toast.error('Please sign in to chat with this agent');
      return;
    }
    
    try {
      await sendMessageMutation.mutateAsync({ 
        content,
        agentType,
        agentConfig,
        needsAuth,
        createConversation: () => createConversationMutation.mutateAsync({})
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  }, [sendMessageMutation, agentType, agentConfig, needsAuth, user, createConversationMutation]);

  return {
    agentConfig,
    configLoading,
    messages,
    messagesLoading,
    currentConversationId,
    sendMessage,
    isLoading: sendMessageMutation.isPending,
    startNewConversation,
    createConversation: createConversationMutation.mutate,
    canUseAgent,
    needsAuth,
    clearGuestMessages,
  };
}
