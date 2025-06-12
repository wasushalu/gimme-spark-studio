
import { useState } from 'react';
import { useChat } from './useChat';
import { agents } from '@/components/agents/AgentSelector';

export function useChatData() {
  const [activeAgent, setActiveAgent] = useState<'gimmebot' | 'creative_concept' | 'neutral_chat'>('gimmebot');
  
  const { 
    agentConfig, 
    configLoading, 
    messages, 
    messagesLoading, 
    sendMessage, 
    isLoading 
  } = useChat(activeAgent, false); // Allow guest users

  // Get the base agent info (name, description, icon) from the static config
  const baseAgentInfo = agents.find(agent => agent.id === activeAgent) || agents[0];

  // Get the dynamic welcome message from the agent config, or fallback to a default
  const getWelcomeMessage = () => {
    if (configLoading) return 'Loading...';
    
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
  };

  const currentAgent = {
    ...baseAgentInfo,
    welcomeMessage: getWelcomeMessage(),
  };

  const handleAgentSelect = (agentId: string) => {
    setActiveAgent(agentId as 'gimmebot' | 'creative_concept' | 'neutral_chat');
  };

  const handleSendMessage = (message: string) => {
    sendMessage({ content: message });
  };

  // Transform ChatMessage[] to Message[] format expected by ChatInterface
  const transformedMessages = messages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.created_at),
  }));

  return {
    activeAgent,
    messages: transformedMessages,
    isLoading: isLoading || messagesLoading || configLoading,
    currentAgent,
    agentConfig,
    handleAgentSelect,
    handleSendMessage,
  };
}
