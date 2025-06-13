
import { useState, useCallback, useEffect } from 'react';

export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Completely isolated storage per agent - using a Map to ensure strict separation
const agentMessageStorage = new Map<string, LocalMessage[]>();

export function useGuestMessages(agentType: string) {
  console.log('useGuestMessages: Initializing for agent:', agentType);
  
  // Initialize isolated storage for this agent if it doesn't exist
  if (!agentMessageStorage.has(agentType)) {
    agentMessageStorage.set(agentType, []);
    console.log('useGuestMessages: Created new isolated storage for agent:', agentType);
  }

  // Get the isolated messages for this specific agent
  const [guestMessages, setGuestMessages] = useState<LocalMessage[]>(() => {
    const messages = agentMessageStorage.get(agentType) || [];
    console.log('useGuestMessages: Loaded', messages.length, 'messages for agent:', agentType);
    return messages;
  });

  // Sync state when agent changes - ensure complete isolation
  useEffect(() => {
    const isolatedMessages = agentMessageStorage.get(agentType) || [];
    console.log('useGuestMessages: Agent switch detected, loading', isolatedMessages.length, 'messages for:', agentType);
    setGuestMessages(isolatedMessages);
  }, [agentType]);

  const addGuestMessage = useCallback((message: LocalMessage) => {
    console.log('addGuestMessage: Adding message for agent', agentType, ':', message.role, message.content.substring(0, 50));
    
    // Update the isolated storage for this specific agent
    const currentMessages = agentMessageStorage.get(agentType) || [];
    const updatedMessages = [...currentMessages, message];
    agentMessageStorage.set(agentType, updatedMessages);
    
    // Update local state
    setGuestMessages(updatedMessages);
    
    console.log('addGuestMessage: Agent', agentType, 'now has', updatedMessages.length, 'messages');
  }, [agentType]);

  const clearGuestMessages = useCallback(() => {
    console.log('clearGuestMessages: Clearing messages for agent:', agentType);
    agentMessageStorage.set(agentType, []);
    setGuestMessages([]);
  }, [agentType]);

  const getMessageCount = useCallback(() => {
    return agentMessageStorage.get(agentType)?.length || 0;
  }, [agentType]);

  return {
    guestMessages,
    addGuestMessage,
    clearGuestMessages,
    getMessageCount,
  };
}
