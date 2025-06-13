
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
  
  console.log('useChatData: Current active agent:', activeAgent);
  
  // Use the frontend agent type directly for complete isolation
  const { needsAuth, canUseAgent } = useChatAuth(activeAgent);
  const { data: agentConfig } = useChatConfig(activeAgent, canUseAgent);
  
  // Use the same agent type for both backend and frontend to maintain complete isolation
  const {
    messages,
    guestMessages,
    messagesLoading,
    sendMessage,
    isLoading: chatLoading,
    currentConversationId,
  } = useChat(activeAgent, false, activeAgent); // Use same agent type for complete isolation

  const handleAgentSelect = useCallback((agentId: string) => {
    const newAgent = agentId as AgentType;
    console.log('useChatData: Switching from', activeAgent, 'to', newAgent);
    
    if (newAgent !== activeAgent) {
      setActiveAgent(newAgent);
      console.log('useChatData: Agent switched to:', newAgent, '- conversations are now completely isolated');
    }
  }, [activeAgent]);

  const handleSendMessage = useCallback(async (content: string) => {
    console.log('useChatData: Sending message with isolated agent:', activeAgent);
    console.log('useChatData: Message will be stored in isolated thread for:', activeAgent);
    
    await sendMessage({ content });
  }, [activeAgent, sendMessage]);

  // Get current agent details with fallback welcome messages
  const currentAgent: Agent = {
    id: activeAgent,
    name: getAgentName(activeAgent),
    description: getAgentDescription(activeAgent),
    welcomeMessage: agentConfig?.settings?.welcome_message || getDefaultWelcomeMessage(activeAgent)
  };

  // Always use guest messages since no auth is required - completely isolated per agent
  const displayMessages = guestMessages;
  
  console.log('useChatData: Displaying', displayMessages.length, 'isolated messages for agent:', activeAgent);

  return {
    activeAgent,
    messages: displayMessages,
    isLoading: chatLoading || messagesLoading,
    currentAgent,
    handleAgentSelect,
    handleSendMessage,
    canUseAgent: true,
    needsAuth: false,
  };
}

function getAgentName(agentType: AgentType): string {
  switch (agentType) {
    case 'gimmebot':
      return 'gimmebot';
    case 'creative_concept':
      return 'Creative Concept';
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
      return 'Creative Sub-Agent';
    case 'neutral_chat':
      return 'Open Conversation';
    case 'studio':
      return 'Creative Assistant';
    default:
      return 'AI Assistant';
  }
}

function getDefaultWelcomeMessage(agentType: AgentType): string {
  switch (agentType) {
    case 'gimmebot':
      return "Hello there! 🤔 I'm gimmebot, your friendly marketing guide here at gimmefy.ai. I'm here to help you navigate the world of marketing, answer questions about gimmefy's features, and point you toward exactly what you need. Whether you're exploring content strategies, curious about our platform, or just want some marketing wisdom—I'm all ears! What brings you here today?";
    case 'creative_concept':
      return "Hi! I'm Creative Concept, a specialized sub-agent focused on generating innovative creative ideas and concepts. I work under the Studio umbrella to help you brainstorm unique approaches, creative strategies, and fresh perspectives for your marketing campaigns. Let's explore some creative possibilities together! What creative challenge can I help you with?";
    case 'studio':
      return "Welcome to Studio! 🎨 I'm your creative AI assistant, ready to help you bring your marketing ideas to life. Whether you need compelling copy, creative concepts, or strategic content direction, I'm here to collaborate with you. Let's create something amazing together! What creative challenge can I help you tackle today?";
    case 'neutral_chat':
      return "Hi there! I'm Jack, your helpful AI assistant. I'm here to provide clear, informative assistance across a wide range of topics. Whether you have questions, need advice, or want to explore ideas, I'm ready to help. What can I assist you with today?";
    default:
      return "Hello! How can I assist you today?";
  }
}
