
import { useState, useCallback, useEffect } from 'react';

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

  // Sync with the Map when the storage key changes (agent switch)
  useEffect(() => {
    console.log('useGuestMessages: Agent type changed to:', storageKey);
    if (!guestMessageStores.has(storageKey)) {
      guestMessageStores.set(storageKey, []);
    }
    const storedMessages = guestMessageStores.get(storageKey) || [];
    console.log('useGuestMessages: Loading messages for agent:', storageKey, 'count:', storedMessages.length);
    setGuestMessages(storedMessages);
  }, [storageKey]);

  const addGuestMessage = useCallback((message: LocalMessage) => {
    console.log('Adding guest message for agent', storageKey, ':', message);
    
    const updatedMessages = [...(guestMessageStores.get(storageKey) || []), message];
    guestMessageStores.set(storageKey, updatedMessages);
    setGuestMessages(updatedMessages);
  }, [storageKey]);

  const clearGuestMessages = useCallback(() => {
    console.log('Clearing guest messages for agent:', storageKey);
    guestMessageStores.set(storageKey, []);
    setGuestMessages([]);
  }, [storageKey]);

  return {
    guestMessages,
    addGuestMessage,
    clearGuestMessages,
  };
}
