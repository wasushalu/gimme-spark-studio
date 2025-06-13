
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
  frontendAgentType?: string
) {
  const queryClient = useQueryClient();
  
  // Use a per-agent conversation ID to ensure complete isolation
  const [agentConversationIds, setAgentConversationIds] = useState<Record<string, string | null>>({});
  
  // Get the isolated conversation ID for this specific agent
  const currentConversationId = agentConversationIds[agentType] || null;
  
  console.log('useChat: Agent', agentType, 'has isolated conversation ID:', currentConversationId);

  // Use the agent type directly for complete isolation
  const storageAgentType = frontendAgentType || agentType;

  const { needsAuth, canUseAgent, user } = useChatAuth(agentType);
  const { data: agentConfig, isLoading: configLoading } = useChatConfig(agentType, canUseAgent);
  
  const { messages, guestMessages, messagesLoading, sendMessageMutation, clearGuestMessages } = useChatMessages(
    currentConversationId,
    user,
    canUseAgent,
    storageAgentType // Use isolated storage per agent
  );
  
  const createConversationMutation = useChatConversation(
    agentType,
    user,
    (newConversationId: string) => {
      // Set conversation ID only for this specific agent
      setAgentConversationIds(prev => ({
        ...prev,
        [agentType]: newConversationId
      }));
    }
  );

  // Clear queries when agent changes to ensure isolation
  useEffect(() => {
    console.log('useChat: Agent changed to:', agentType, '- ensuring query isolation');
    queryClient.removeQueries({ queryKey: ['chat-messages'] });
  }, [agentType, queryClient]);

  const startNewConversation = useCallback(() => {
    console.log('useChat: Starting new isolated conversation for agent:', agentType);
    
    // Clear only this agent's conversation ID
    setAgentConversationIds(prev => ({
      ...prev,
      [agentType]: null
    }));
    
    queryClient.removeQueries({ queryKey: ['chat-messages'] });
    
    // Clear guest messages only for this specific agent
    if (!user && clearGuestMessages) {
      clearGuestMessages();
    }
  }, [queryClient, user, clearGuestMessages, agentType]);

  const sendMessage = useCallback(async ({ content }: { content: string }) => {
    if (!content.trim()) return;
    
    if (needsAuth && !user) {
      toast.error('Please sign in to chat with this agent');
      return;
    }
    
    console.log('useChat: Sending message for isolated agent:', agentType);
    
    try {
      await sendMessageMutation.mutateAsync({ 
        content,
        agentType,
        agentConfig,
        needsAuth,
        createConversation: () => createConversationMutation.mutateAsync({})
      });
    } catch (error) {
      console.error('Error in sendMessage for agent', agentType, ':', error);
    }
  }, [sendMessageMutation, agentType, agentConfig, needsAuth, user, createConversationMutation]);

  return {
    agentConfig,
    configLoading,
    messages,
    guestMessages,
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
