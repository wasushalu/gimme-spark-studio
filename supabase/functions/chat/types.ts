
export interface ChatRequest {
  conversationId?: string;
  message: string;
  agentType: string;
  agentConfig?: any;
  isGuest?: boolean;
}

export interface ChatResponse {
  response: string;
}

export interface AgentConfig {
  prompt: string;
  model: {
    text: {
      provider: string;
      model: string;
    };
    image?: {
      model: string;
    };
  };
  generation: {
    temperature: number;
    max_response_tokens: number;
    max_context_tokens: number;
  };
}

export interface ConversationMessage {
  role: string;
  content: string;
}
