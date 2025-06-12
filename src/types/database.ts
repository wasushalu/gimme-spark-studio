
export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMembership {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export interface AgentConfiguration {
  id: string;
  agent_type: 'gimmebot' | 'creative_concept' | 'neutral_chat';
  name: string;
  description?: string;
  system_prompt: string;
  model: string;
  max_tokens: number;
  temperature: number;
  tools: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatConversation {
  id: string;
  workspace_id?: string;
  user_id: string;
  agent_type: 'gimmebot' | 'creative_concept' | 'neutral_chat';
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}
