
import { useState, useMemo, useCallback } from 'react';
import { useChat } from './useChat';
import { useAuth } from './useAuth';
import { agents } from '@/components/agents/AgentSelector';
import type { AgentType } from '@/types/database';

export function useChatData() {
  const [activeAgent, setActiveAgent] = useState<AgentType>('gimmebot');
  const { user } = useAuth();
  
  const { 
    agentConfig, 
    configLoading, 
    messages: dbMessages, 
    guestMessages,
    messagesLoading, 
    sendMessage, 
    isLoading,
    canUseAgent,
    needsAuth,
    clearGuestMessages
  } = useChat(activeAgent, false);

  // Use guest messages for non-authenticated users, database messages for authenticated users
  const messages = useMemo(() => {
    const sourceMessages = user ? dbMessages : guestMessages;
    console.log('=== MESSAGE SOURCE SELECTION ===');
    console.log('User authenticated:', !!user);
    console.log('Using guest messages:', !user);
    console.log('Source messages count:', sourceMessages?.length || 0);
    console.log('Source messages:', sourceMessages);
    return sourceMessages || [];
  }, [user, dbMessages, guestMessages]);

  // Get the base agent info (name, description, icon) from the static config
  const baseAgentInfo = useMemo(() => {
    const agent = agents.find(agent => agent.id === activeAgent);
    if (!agent) {
      console.warn(`useChatData: Agent ${activeAgent} not found in agents list, using fallback`);
      return agents[0]; // fallback to gimmebot
    }
    return agent;
  }, [activeAgent]);

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
      } else if (prompt.includes('studio')) {
        return 'Welcome to Studio! I\'m your creative command hub. What campaign or project can I help you with today?';
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
    
    // Validate agent ID
    const validAgents: AgentType[] = ['gimmebot', 'studio', 'neutral_chat', 'creative_concept'];
    if (!validAgents.includes(agentId as AgentType)) {
      console.error('Invalid agent ID:', agentId);
      return;
    }
    
    // Clear guest messages when switching agents
    if (!user && clearGuestMessages) {
      console.log('Clearing guest messages for agent switch');
      clearGuestMessages();
    }
    
    setActiveAgent(agentId as AgentType);
  }, [user, clearGuestMessages]);

  const handleSendMessage = useCallback((message: string) => {
    console.log('=== HANDLE SEND MESSAGE START ===');
    console.log('Message to send:', message);
    console.log('Current loading state:', isLoading);
    console.log('Messages loading state:', messagesLoading);
    
    if (!message.trim()) {
      console.warn('Empty message attempted to send');
      return;
    }
    
    sendMessage({ content: message });
  }, [sendMessage, isLoading, messagesLoading]);

  // Transform messages to UI format
  const transformedMessages = useMemo(() => {
    console.log('=== TRANSFORMING MESSAGES FOR UI ===');
    console.log('Raw messages:', messages);
    
    if (!Array.isArray(messages)) {
      console.error('Messages is not an array:', messages);
      return [];
    }
    
    const transformed = messages.map(msg => {
      if (!msg || typeof msg !== 'object') {
        console.error('Invalid message object:', msg);
        return null;
      }
      
      return {
        id: msg.id || `temp-${Date.now()}-${Math.random()}`,
        role: (msg.role as 'user' | 'assistant') || 'user',
        content: msg.content || '',
        timestamp: new Date(msg.created_at || Date.now()),
      };
    }).filter(Boolean);
    
    console.log('Transformed messages for UI:', transformed);
    return transformed;
  }, [messages]);

  console.log('=== CHAT DATA STATE ===');
  console.log('Active agent:', activeAgent);
  console.log('User authenticated:', !!user);
  console.log('Using guest messages:', !user);
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
