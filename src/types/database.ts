
export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_admin?: boolean;
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
  agent_type: 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio';
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

export interface Agent {
  id: string;
  agent_id: string;
  label: string;
  type: 'root' | 'sub' | 'utility';
  visibility: 'public' | 'workspace' | 'internal';
  created_at: string;
}

export interface AgentConfigVersion {
  id: string;
  agent_id: string;
  version: number;
  is_active: boolean;
  settings: {
    model: {
      text: { provider: string; model: string };
      image: { provider: string; model: string };
      audio: { provider: string; model: string };
      video: { provider: string; model: string };
      vision: { provider: string; model: string };
    };
    generation: {
      max_context_tokens: number;
      max_response_tokens: number;
      temperature: number;
      top_p: number;
    };
    prompt: string;
    welcome_message: string;
    tools: string[];
    knowledge_base: {
      enabled: boolean;
      vector_store_id: string | null;
      chunk_size: number;
      chunk_overlap: number;
      retrieval_depth: number;
      keyword_extraction: string;
    };
    agent_as_tool: {
      expose: boolean;
      function_name: string;
      signature: Record<string, any>;
    };
    router: {
      strategy: string;
      default_child: string | null;
    };
  };
  created_by?: string;
  created_at: string;
}

export interface ModelCatalog {
  id: string;
  modality: 'text' | 'image' | 'audio' | 'video';
  provider: string;
  model_name: string;
  enabled: boolean;
  created_at: string;
}

export interface ToolRegistry {
  id: string;
  name: string;
  description?: string;
  function_schema: Record<string, any>;
  enabled: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  workspace_id?: string;
  user_id: string;
  agent_type: 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio';
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

export interface KnowledgeBaseDocument {
  id: string;
  agent_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  content_type: 'pdf' | 'text' | 'docx' | 'markdown';
  status: 'processing' | 'completed' | 'failed';
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseChunk {
  id: string;
  document_id: string;
  agent_id: string;
  chunk_index: number;
  content: string;
  word_count: number;
  char_count: number;
  embedding: number[] | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Define agent types for consistency
export type AgentType = 'gimmebot' | 'creative_concept' | 'neutral_chat' | 'studio';
export type AgentRole = 'user' | 'assistant' | 'system';
