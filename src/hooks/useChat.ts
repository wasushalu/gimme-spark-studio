
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatConversation, ChatMessage, AgentConfigVersion } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useChat(agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat', requireAuth = false) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Check if this agent requires authentication
  const needsAuth = agentType !== 'gimmebot';
  const canUseAgent = !needsAuth || user;

  // Fetch agent configuration from the new agent_config_versions table
  const { data: agentConfig, isLoading: configLoading } = useQuery({
    queryKey: ['agent-config', agentType],
    queryFn: async () => {
      console.log('useChat: Fetching config for agent type:', agentType);
      
      const { data: configData, error: configError } = await supabase
        .from('agent_config_versions')
        .select('*')
        .eq('agent_id', agentType)
        .eq('is_active', true)
        .maybeSingle();

      if (configError) {
        console.error('useChat: Error fetching agent config:', configError);
        return null; // Return null instead of throwing to allow fallback
      }
      
      console.log('useChat: Agent config result:', configData);
      
      return configData as AgentConfigVersion;
    },
    enabled: canUseAgent,
  });

  // Fetch conversation messages - only if user is authenticated and has a conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
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
  });

  // Create conversation mutation - only available for authenticated users
  const createConversationMutation = useMutation({
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

  // Send message mutation - works for both authenticated and unauthenticated users for gimmebot only
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, conversationId }: { content: string; conversationId?: string }) => {
      console.log('Sending message:', content);
      
      // Check if agent requires authentication
      if (needsAuth && !user) {
        throw new Error('Please sign in to chat with this agent');
      }

      let activeConversationId = conversationId || currentConversationId;

      // Create conversation if none exists and user is authenticated
      if (!activeConversationId && user) {
        console.log('No conversation exists, creating new one');
        const conversation = await createConversationMutation.mutateAsync({});
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

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    queryClient.removeQueries({ queryKey: ['chat-messages'] });
  }, [queryClient]);

  const sendMessage = useCallback(async ({ content }: { content: string }) => {
    if (!content.trim()) return;
    
    // Check if agent requires authentication before proceeding
    if (needsAuth && !user) {
      toast.error('Please sign in to chat with this agent');
      return;
    }
    
    try {
      await sendMessageMutation.mutateAsync({ content });
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  }, [sendMessageMutation, needsAuth, user]);

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
    canUseAgent, // New property to indicate if the agent can be used
    needsAuth, // New property to indicate if auth is required
  };
}
