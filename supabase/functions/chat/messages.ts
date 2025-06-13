
export async function getConversationMessages(supabaseClient: any, conversationId: string) {
  const { data: conversationMessages, error: messagesError } = await supabaseClient
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
    throw new Error(`Failed to fetch conversation messages: ${messagesError.message}`);
  }

  return conversationMessages || [];
}

export async function saveAiResponse(
  supabaseClient: any,
  conversationId: string,
  content: string,
  metadata: any
) {
  const { error: saveError } = await supabaseClient
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: content,
      metadata: metadata
    });

  if (saveError) {
    console.error('Error saving AI response:', saveError);
    console.warn('Continuing despite save error');
  } else {
    console.log('AI response saved successfully');
  }
}
