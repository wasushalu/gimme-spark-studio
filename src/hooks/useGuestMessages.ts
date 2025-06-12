
import { useState, useCallback } from 'react';

// Local message type for guest users
interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  conversation_id?: string;
}

export function useGuestMessages() {
  const [guestMessages, setGuestMessages] = useState<LocalMessage[]>([]);

  const addGuestMessage = useCallback((message: LocalMessage) => {
    console.log('=== ADDING GUEST MESSAGE ===');
    console.log('Message to add:', message);
    setGuestMessages(prev => {
      const updated = [...prev, message];
      console.log('Updated guest messages:', updated);
      return updated;
    });
  }, []);

  const clearGuestMessages = useCallback(() => {
    console.log('=== CLEARING GUEST MESSAGES ===');
    setGuestMessages([]);
  }, []);

  return {
    guestMessages,
    addGuestMessage,
    clearGuestMessages,
  };
}

export type { LocalMessage };
