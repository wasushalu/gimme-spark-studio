
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatConversation, ChatMessage, AgentConfigVersion } from '@/types/database';
import { useAuth } from './useAuth';

export function useChat(agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat') {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Fetch agent configuration from the new agent_config_versions table
  const { data: agentConfig } = useQuery({
    queryKey: ['agent-config', agentType],
    queryFn: async () => {
      console.log('useChat: Fetching config for agent type:', agentType);
      
      // First try to get from agent_config_versions table
      const { data: configData, error: configError } = await supabase
        .from('agent_config_versions')
        .select('*')
        .eq('agent_id', agentType)
        .eq('is_active', true)
        .maybeSingle();

      if (configError) {
        console.error('useChat: Error fetching agent config:', configError);
      }
      
      console.log('useChat: Agent config result:', configData);
      
      return configData as AgentConfigVersion;
    },
  });

  // Fetch conversation messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', currentConversationId],
    queryFn: async () => {
      if (!currentConversationId) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!currentConversationId,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async ({ title, workspaceId }: { title?: string; workspaceId?: string }) => {
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          agent_type: agentType,
          title,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatConversation;
    },
    onSuccess: (conversation) => {
      setCurrentConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, conversationId }: { content: string; conversationId?: string }) => {
      let activeConversationId = conversationId || currentConversationId;

      // Create conversation if none exists
      if (!activeConversationId) {
        const conversation = await createConversationMutation.mutateAsync({});
        activeConversationId = conversation.id;
      }

      // Add user message
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: activeConversationId,
          role: 'user',
          content,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Call edge function to get AI response, passing the agent configuration
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat', {
        body: {
          conversationId: activeConversationId,
          message: content,
          agentType,
          agentConfig: agentConfig?.settings, // Pass the dynamic configuration
        },
      });

      if (aiError) throw aiError;

      return { userMessage: userMessage as ChatMessage, aiResponse };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', currentConversationId] });
    },
  });

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
  }, []);

  return {
    agentConfig,
    messages,
    messagesLoading,
    currentConversationId,
    sendMessage: sendMessageMutation.mutate,
    isLoading: sendMessageMutation.isPending,
    startNewConversation,
    createConversation: createConversationMutation.mutate,
  };
}
