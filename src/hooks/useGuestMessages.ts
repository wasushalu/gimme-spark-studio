
import { useState, useCallback } from 'react';

export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Store messages per agent type for guest users - using a more robust storage approach
const guestMessageStores = new Map<string, LocalMessage[]>();

export function useGuestMessages(agentType?: string) {
  const storageKey = agentType || 'default';
  
  // Initialize with stored messages for this agent, ensuring each agent has its own isolated store
  const [guestMessages, setGuestMessages] = useState<LocalMessage[]>(() => {
    if (!guestMessageStores.has(storageKey)) {
      guestMessageStores.set(storageKey, []);
    }
    return guestMessageStores.get(storageKey) || [];
  });

  const addGuestMessage = useCallback((message: LocalMessage) => {
    console.log('Adding guest message for agent', storageKey, ':', message);
    
    setGuestMessages(prev => {
      const updated = [...prev, message];
      // Store in the isolated Map for this agent
      guestMessageStores.set(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  const clearGuestMessages = useCallback(() => {
    console.log('Clearing guest messages for agent:', storageKey);
    setGuestMessages([]);
    // Clear from the isolated Map store
    guestMessageStores.set(storageKey, []);
  }, [storageKey]);

  return {
    guestMessages,
    addGuestMessage,
    clearGuestMessages,
  };
}
