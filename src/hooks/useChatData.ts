
import { useState, useMemo, useCallback } from 'react';
import { useChat } from './useChat';
import { useAuth } from './useAuth';
import { agents } from '@/components/agents/AgentSelector';

export function useChatData() {
  const [activeAgent, setActiveAgent] = useState<'gimmebot' | 'creative_concept' | 'neutral_chat'>('gimmebot');
  const { user } = useAuth();
  
  const { 
    agentConfig, 
    configLoading, 
    messages, 
    messagesLoading, 
    sendMessage, 
    isLoading,
    canUseAgent,
    needsAuth
  } = useChat(activeAgent, false);

  // Get the base agent info (name, description, icon) from the static config
  const baseAgentInfo = useMemo(() => 
    agents.find(agent => agent.id === activeAgent) || agents[0], 
    [activeAgent]
  );

  // Get the dynamic welcome message from the agent config, or fallback to a default
  const welcomeMessage = useMemo(() => {
    if (configLoading) return 'Loading...';
    
    // If agent needs auth and user is not logged in, show auth message
    if (needsAuth && !user) {
      return 'Please sign in to chat with this agent. You can continue using gimmebot without signing in.';
    }
    
    // Check if agentConfig and settings exist, and if welcome_message is defined
    if (agentConfig?.settings?.welcome_message) {
      return agentConfig.settings.welcome_message;
    }
    
    // Fallback welcome messages based on agent type
    switch (activeAgent) {
      case 'gimmebot':
        return 'Hello! I\'m gimmebot, your AI marketing assistant. How can I help you create amazing marketing content today?';
      case 'creative_concept':
        return 'Hi there! I\'m Studio, your creative ideas generator. What creative project can I help you brainstorm today?';
      case 'neutral_chat':
        return 'Hello! I\'m here for open conversation. What would you like to chat about?';
      default:
        return 'Hello! How can I help you today?';
    }
  }, [configLoading, needsAuth, user, agentConfig, activeAgent]);

  const currentAgent = useMemo(() => ({
    ...baseAgentInfo,
    welcomeMessage,
  }), [baseAgentInfo, welcomeMessage]);

  const handleAgentSelect = useCallback((agentId: string) => {
    setActiveAgent(agentId as 'gimmebot' | 'creative_concept' | 'neutral_chat');
  }, []);

  const handleSendMessage = useCallback((message: string) => {
    sendMessage({ content: message });
  }, [sendMessage]);

  // Transform ChatMessage[] to Message[] format expected by ChatInterface
  const transformedMessages = useMemo(() => 
    messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at),
    })), [messages]
  );

  return {
    activeAgent,
    messages: transformedMessages,
    isLoading: isLoading || messagesLoading || configLoading,
    currentAgent,
    agentConfig,
    handleAgentSelect,
    handleSendMessage,
    canUseAgent,
    needsAuth,
  };
}
