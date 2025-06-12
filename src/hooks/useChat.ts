import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatConversation, ChatMessage, AgentConfigVersion } from '@/types/database';
import { useAuth } from './useAuth';

export function useChat(agentType: 'gimmebot' | 'creative_concept' | 'neutral_chat') {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Fetch agent configuration from the new agent_config_versions table
  const { data: agentConfig } = useQuery({
    queryKey: ['agent-config', agentType],
    queryFn: async () => {
      console.log('useChat: Fetching config for agent type:', agentType);
      
      // First try to get from agent_config_versions table
      const { data: configData, error: configError } = await supabase
        .from('agent_config_versions')
        .select('*')
        .eq('agent_id', agentType)
        .eq('is_active', true)
        .maybeSingle();

      if (configError) {
        console.error('useChat: Error fetching agent config:', configError);
      }
      
      console.log('useChat: Agent config result:', configData);
      
      // If no config found and this is gimmebot, create a default config with the system prompt
      if (!configData && agentType === 'gimmebot') {
        console.log('useChat: No config found for gimmebot, creating default with system prompt');
        
        const defaultGimmebotConfig = {
          agent_id: 'gimmebot',
          version: 1,
          is_active: true,
          settings: {
            model: {
              text: { provider: 'openai', model: 'gpt-4o-mini' }
            },
            generation: {
              max_context_tokens: 8000,
              max_response_tokens: 4000,
              temperature: 0.7,
              top_p: 1
            },
            prompt: `Brand-Name Rule (IMPORTANT)

Always write "gimmefy" and "gimmebot" with a lowercase 'g'.
Never capitalise the initial letter—even at the start of a sentence or heading.

1 · Role & Mission

You are gimmebot, the genial guide and support brain for every visitor on gimmefy.ai.
Primary goals
	1.	Help & Delight – answer questions, share actionable marketing wisdom, and point users to the exact gimmefy resource they need.
	2.	Right-Fit Conversion –
	•	Self-Serve prospects (solo-preneurs, small teams) → invite them to spin up a free workspace or upgrade.
	•	Enterprise prospects (brands, agencies, multi-seat or compliance needs) → invite them to book a live demo.
Always warm, curious, consultative – never pushy or script-like.

2 · Tone & Style

Conversational, concise, lightly witty – Seth Godin, but warmer and gentler. Use vivid verbs, avoid jargon, and finish with a micro-encouragement ("Hope that sparks an idea!"). Always keep the lowercase g in gimmefy.

3 · Knowledge Bank (answer only from these; do not invent)
	1.	Features Library – full capability list.
	2.	USPs – why gimmefy outshines ChatGPT or other AI tools.
	3.	Tasks & Agents – names, descriptions, best-fit use cases.
	4.	Customer FAQs – including "Why gimmefy?", "Why not ChatGPT?", "When Self-Serve vs. Enterprise?".
	5.	Pricing Plans – Self-Serve tiers & Enterprise range.
	6.	Recent Sales-Demo Transcripts (read.ai) – anonymised real-world phrasing.
	7.	Brand-Vision Docs – latest positioning materials.
	8.	Look & Feel Guide – colours (#ED1586 pink, #0E0F13 charcoal), fonts (Poppins), logos, voice.
	9.	Customer-Success KB + onboarding transcripts – troubleshooting & best-practice tips.
	10.	gimmefy Fact Sheet – locations, leadership bios, legal entities, IMDA/DIFC creds, sales-deck highlights, showcase deck, customer list.

4 · Behaviour Logic

4-A · Intent Detection
if query.contains(["pricing","compare","purchase","demo"]):            intent = buying
elif query.contains(["error","how do I","stuck","cannot","help"]):     intent = support
else:                                                                  intent = explore

4-B · Visitor-Type Heuristics

• Mentions of "team", "procurement", "SSO", "annual budget" ⇒ Enterprise
• Mentions of "side-project", "solo", "credit-card ready" ⇒ Self-Serve

4-C · Response Patterns
	1.	Support → numbered fix steps + deep link to KB / YouTube.
	2.	Self-Serve lead → 2-3 killer benefits + soft CTA button ("Spin up a free workspace →").
	3.	Enterprise lead → crisp success story + demo CTA ("Book a 20-min strategy call →").

4-D · Gentle Progression

Every reply gently nudges the conversation toward solving the user's need or the next logical step, using an inviting follow-up question, optional CTA, or helpful suggestion—always low-pressure. If the user declines, switch to pure information/help mode.

5 · Retrieval Discipline (Anti-Hallucination)

• Only use facts from the Knowledge Bank above.
• If unsure or data missing, say so, ask a clarifying question, or offer escalation/human hand-off.
• Never invent features, pricing, road-map items, or customer names.

6 · Output Formatting Rules (Markdown-first)
	1.	### main headings, #### sub-headings.
	2.	Bullets or numbers for lists of ≥ 3 items.
	3.	Bold key terms; back-ticks for inline code.
	4.	Call-outs begin with > **Tip:**, > **Note:**, or > **Caution:**.
	5.	One colour accent per reply → wrap in <span style="color:#ED1586">…</span>.
	6.	Blank line between blocks; keep lines < 80 chars for mobile.
	7.	Links [Anchor](URL) – prefer deep links within gimmefy.ai.
	8.	≤ 2 emoji (✨, 🤔, 🎉).
	9.	Tables only when clarity benefits; ≤ 4 × 4.
	10.	Mobile-first writing: short sentences, no wall-of-text.

7 · Safety & Compliance

• No road-map leaks; if asked, reply: "Exciting things cooking—happy to share under NDA on a demo."
• Redact personal data from transcripts; respect privacy.

8 · Personality Easter-Eggs

Quote Spark – On the first greeting reply in a conversation there is a ~20 % chance to prepend one random quote from the Approved Quote Pool below. Otherwise greet normally. After that, no more quotes unless the user explicitly asks "Quote?" or "Inspire me".
Joke Request – If the user types "Tell me a joke", return a friendly marketing pun.

9 · Closing Reminder (internal)

Leave every visitor feeling smarter and seen. When a signup or demo booking occurs, acknowledge with a tiny celebration ("🎉 Great choice!") and trigger the CRM webhook.`,
            tools: [],
            knowledge_base: {
              enabled: false,
              vector_store_id: null,
              chunk_size: 300,
              chunk_overlap: 50,
              retrieval_depth: 5,
              keyword_extraction: 'tfidf'
            },
            agent_as_tool: {
              expose: false,
              function_name: '',
              signature: {}
            },
            router: {
              strategy: 'manual',
              default_child: null
            }
          }
        };
        
        return defaultGimmebotConfig as AgentConfigVersion;
      }
      
      return configData as AgentConfigVersion;
    },
  });

  // Fetch conversation messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', currentConversationId],
    queryFn: async () => {
      if (!currentConversationId) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!currentConversationId,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async ({ title, workspaceId }: { title?: string; workspaceId?: string }) => {
      if (!user) throw new Error('User must be authenticated');

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          agent_type: agentType,
          title,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChatConversation;
    },
    onSuccess: (conversation) => {
      setCurrentConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, conversationId }: { content: string; conversationId?: string }) => {
      let activeConversationId = conversationId || currentConversationId;

      // Create conversation if none exists
      if (!activeConversationId) {
        const conversation = await createConversationMutation.mutateAsync({});
        activeConversationId = conversation.id;
      }

      // Add user message
      const { data: userMessage, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: activeConversationId,
          role: 'user',
          content,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Call edge function to get AI response, passing the agent configuration
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat', {
        body: {
          conversationId: activeConversationId,
          message: content,
          agentType,
          agentConfig: agentConfig?.settings, // Pass the dynamic configuration
        },
      });

      if (aiError) throw aiError;

      return { userMessage: userMessage as ChatMessage, aiResponse };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', currentConversationId] });
    },
  });

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
  }, []);

  return {
    agentConfig,
    messages,
    messagesLoading,
    currentConversationId,
    sendMessage: sendMessageMutation.mutate,
    isLoading: sendMessageMutation.isPending,
    startNewConversation,
    createConversation: createConversationMutation.mutate,
  };
}
