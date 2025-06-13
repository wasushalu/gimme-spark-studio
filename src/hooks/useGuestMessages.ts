
import { useState, useCallback } from 'react';

export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Store messages per agent type for guest users
const guestMessageStore: Record<string, LocalMessage[]> = {};

export function useGuestMessages(agentType?: string) {
  const storageKey = agentType || 'default';
  
  // Initialize with stored messages for this agent
  const [guestMessages, setGuestMessages] = useState<LocalMessage[]>(() => {
    return guestMessageStore[storageKey] || [];
  });

  const addGuestMessage = useCallback((message: LocalMessage) => {
    console.log('Adding guest message for agent', storageKey, ':', message);
    
    setGuestMessages(prev => {
      const updated = [...prev, message];
      // Store in memory for this agent
      guestMessageStore[storageKey] = updated;
      return updated;
    });
  }, [storageKey]);

  const clearGuestMessages = useCallback(() => {
    console.log('Clearing guest messages for agent:', storageKey);
    setGuestMessages([]);
    // Clear from memory store
    guestMessageStore[storageKey] = [];
  }, [storageKey]);

  return {
    guestMessages,
    addGuestMessage,
    clearGuestMessages,
  };
}
