
import type { User } from '@supabase/supabase-js';
import { useGuestMessages } from './useGuestMessages';
import { useSendMessage } from './useSendMessage';
import { useDatabaseMessages } from './useDatabaseMessages';

export function useChatMessages(
  currentConversationId: string | null,
  user: User | null,
  canUseAgent: boolean
) {
  // Local state for guest user messages
  const { guestMessages, addGuestMessage, clearGuestMessages } = useGuestMessages();
  
  // Database messages for authenticated users
  const { messages, messagesLoading } = useDatabaseMessages(
    currentConversationId,
    user,
    canUseAgent
  );

  // Send message mutation
  const sendMessageMutation = useSendMessage(
    currentConversationId,
    user,
    addGuestMessage
  );

  return {
    messages, // Database messages (for authenticated users)
    guestMessages, // Local messages (for guest users)
    messagesLoading,
    sendMessageMutation,
    clearGuestMessages,
  };
}
