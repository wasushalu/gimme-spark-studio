
import { useState, useCallback } from 'react';
import { useChatAuth } from './useChatAuth';
import { useChatConfig } from './useChatConfig';
import { useChat } from './useChat';

type AgentType = 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio';

interface Agent {
  id: string;
  name: string;
  description: string;
  welcomeMessage: string;
}

export function useChatData() {
  const [activeAgent, setActiveAgent] = useState<AgentType>('gimmebot');
  
  // Map creative_concept to studio for backend compatibility
  const backendAgentType = activeAgent === 'creative_concept' ? 'studio' : activeAgent;
  
  const { needsAuth, canUseAgent } = useChatAuth(backendAgentType);
  const { data: agentConfig } = useChatConfig(backendAgentType, canUseAgent);
  
  const {
    messages,
    messagesLoading,
    sendMessage,
    isLoading: chatLoading,
  } = useChat(backendAgentType);

  const handleAgentSelect = useCallback((agentId: string) => {
    setActiveAgent(agentId as AgentType);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!canUseAgent) return;
    
    console.log('useChatData: Sending message with agent config:', {
      agentType: backendAgentType,
      hasConfig: !!agentConfig,
      configPromptLength: agentConfig?.settings?.prompt?.length || 0
    });
    
    await sendMessage({ 
      content,
      agentConfig: agentConfig?.settings || undefined
    });
  }, [canUseAgent, backendAgentType, agentConfig, sendMessage]);

  // Get current agent details with fallback welcome messages
  const currentAgent: Agent = {
    id: activeAgent,
    name: getAgentName(activeAgent),
    description: getAgentDescription(activeAgent),
    welcomeMessage: agentConfig?.settings?.welcome_message || getDefaultWelcomeMessage(activeAgent)
  };

  return {
    activeAgent,
    messages,
    isLoading: chatLoading || messagesLoading,
    currentAgent,
    handleAgentSelect,
    handleSendMessage,
    canUseAgent,
    needsAuth,
  };
}

function getAgentName(agentType: AgentType): string {
  switch (agentType) {
    case 'gimmebot':
      return 'gimmebot';
    case 'creative_concept':
      return 'Studio';
    case 'neutral_chat':
      return 'Jack';
    case 'studio':
      return 'Studio';
    default:
      return 'Assistant';
  }
}

function getAgentDescription(agentType: AgentType): string {
  switch (agentType) {
    case 'gimmebot':
      return 'AI Marketing Assistant';
    case 'creative_concept':
      return 'Creative Hub';
    case 'neutral_chat':
      return 'Open Conversation';
    case 'studio':
      return 'Creative Hub';
    default:
      return 'AI Assistant';
  }
}

function getDefaultWelcomeMessage(agentType: AgentType): string {
  switch (agentType) {
    case 'gimmebot':
      return "Hello there! 🤔 I'm gimmebot, your friendly marketing guide here at gimmefy.ai. I'm here to help you navigate the world of marketing, answer questions about gimmefy's features, and point you toward exactly what you need. Whether you're exploring content strategies, curious about our platform, or just want some marketing wisdom—I'm all ears! What brings you here today?";
    case 'creative_concept':
    case 'studio':
      return "Welcome to Studio! 🎨 I'm your creative AI assistant, ready to help you bring your marketing ideas to life. Whether you need compelling copy, creative concepts, or strategic content direction, I'm here to collaborate with you. Let's create something amazing together! What creative challenge can I help you tackle today?";
    case 'neutral_chat':
      return "Hi there! I'm Jack, your helpful AI assistant. I'm here to provide clear, informative assistance across a wide range of topics. Whether you have questions, need advice, or want to explore ideas, I'm ready to help. What can I assist you with today?";
    default:
      return "Hello! How can I assist you today?";
  }
}
