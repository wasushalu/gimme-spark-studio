
import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useChatAuth } from './useChatAuth';
import { useChatConfig } from './useChatConfig';
import { useChatMessages } from './useChatMessages';
import { useChatConversation } from './useChatConversation';

export function useChat(
  agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio', 
  requireAuth = false,
  frontendAgentType?: string // New parameter for guest message storage
) {
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [lastAgentType, setLastAgentType] = useState<string>(agentType);

  // Use the frontend agent type for guest storage, fallback to backend type
  const storageAgentType = frontendAgentType || agentType;

  // Use smaller hooks
  const { needsAuth, canUseAgent, user } = useChatAuth(agentType);
  
  const { data: agentConfig, isLoading: configLoading } = useChatConfig(agentType, canUseAgent);
  
  const { messages, guestMessages, messagesLoading, sendMessageMutation, clearGuestMessages } = useChatMessages(
    currentConversationId,
    user,
    canUseAgent,
    storageAgentType // Use frontend agent type for guest message isolation
  );
  
  const createConversationMutation = useChatConversation(
    agentType,
    user,
    setCurrentConversationId
  );

  // Handle agent type changes - reset conversation ID but preserve guest messages per agent
  useEffect(() => {
    if (lastAgentType !== agentType) {
      console.log('Agent type changed from', lastAgentType, 'to', agentType, '- resetting conversation ID but preserving guest messages');
      setCurrentConversationId(null);
      setLastAgentType(agentType);
      
      // Clear relevant queries for the old agent
      queryClient.removeQueries({ queryKey: ['chat-messages'] });
      
      // Don't clear guest messages - each agent maintains its own conversation thread
      // The useGuestMessages hook already handles per-agent isolation via the storageAgentType parameter
    }
  }, [agentType, lastAgentType, queryClient]);

  const startNewConversation = useCallback(() => {
    console.log('Starting new conversation for agent:', agentType);
    setCurrentConversationId(null);
    queryClient.removeQueries({ queryKey: ['chat-messages'] });
    
    // Clear guest messages for the current agent only
    if (!user && clearGuestMessages) {
      clearGuestMessages();
    }
  }, [queryClient, user, clearGuestMessages, agentType]);

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
    guestMessages, // Export guest messages
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
