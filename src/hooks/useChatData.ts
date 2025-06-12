
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
    
    // Check for prompt in agent config as fallback for welcome message
    if (agentConfig?.settings?.prompt) {
      // Create a friendly welcome message based on the system prompt
      const prompt = agentConfig.settings.prompt.toLowerCase();
      if (prompt.includes('marketing')) {
        return 'Hello! I\'m your AI marketing assistant. How can I help you create amazing marketing content today?';
      } else if (prompt.includes('creative')) {
        return 'Hi there! I\'m your creative assistant. What creative project can I help you brainstorm today?';
      } else {
        return 'Hello! I\'m here to help. What can I assist you with today?';
      }
    }
    
    // Final fallback - generic welcome message
    return 'Hello! How can I help you today?';
  }, [configLoading, needsAuth, user, agentConfig, activeAgent]);

  const currentAgent = useMemo(() => ({
    ...baseAgentInfo,
    welcomeMessage,
  }), [baseAgentInfo, welcomeMessage]);

  const handleAgentSelect = useCallback((agentId: string) => {
    console.log('=== AGENT SELECTION ===');
    console.log('Switching to agent:', agentId);
    setActiveAgent(agentId as 'gimmebot' | 'creative_concept' | 'neutral_chat');
  }, []);

  const handleSendMessage = useCallback((message: string) => {
    console.log('=== HANDLE SEND MESSAGE START ===');
    console.log('Message to send:', message);
    console.log('Current loading state:', isLoading);
    console.log('Messages loading state:', messagesLoading);
    
    sendMessage({ content: message });
  }, [sendMessage, isLoading, messagesLoading]);

  // Transform ChatMessage[] to Message[] format expected by ChatInterface
  const transformedMessages = useMemo(() => {
    console.log('=== TRANSFORMING MESSAGES ===');
    console.log('Raw messages from database:', messages);
    
    const transformed = messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at),
    }));
    
    console.log('Transformed messages for UI:', transformed);
    return transformed;
  }, [messages]);

  console.log('=== CHAT DATA STATE ===');
  console.log('Active agent:', activeAgent);
  console.log('Messages count:', transformedMessages.length);
  console.log('Is loading:', isLoading || messagesLoading || configLoading);
  console.log('Can use agent:', canUseAgent);
  console.log('Needs auth:', needsAuth);

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
