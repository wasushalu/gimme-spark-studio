
-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for user roles in workspaces
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Create enum for agent types
CREATE TYPE public.agent_type AS ENUM ('gimmebot', 'creative_concept', 'neutral_chat');

-- Create workspaces table
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace memberships table
CREATE TABLE public.workspace_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role workspace_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- Create brand vault files table
CREATE TABLE public.brand_vault_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    tags TEXT[],
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create embeddings table for vector search
CREATE TABLE public.document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES public.brand_vault_files(id) ON DELETE CASCADE NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimensions
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent configurations table
CREATE TABLE public.agent_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type agent_type NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-4o',
    max_tokens INTEGER DEFAULT 4000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    tools JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat conversations table
CREATE TABLE public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_type agent_type NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table for billing
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'inactive',
    plan_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_vault_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for workspaces (users can see workspaces they're members of)
CREATE POLICY "Users can view workspaces they belong to"
    ON public.workspaces FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.workspace_memberships 
        WHERE workspace_id = workspaces.id AND user_id = auth.uid()
    ));

-- RLS Policies for workspace memberships
CREATE POLICY "Users can view memberships in their workspaces"
    ON public.workspace_memberships FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.workspace_memberships wm 
        WHERE wm.workspace_id = workspace_memberships.workspace_id 
        AND wm.user_id = auth.uid()
    ));

-- RLS Policies for brand vault files
CREATE POLICY "Users can view files in their workspaces"
    ON public.brand_vault_files FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.workspace_memberships 
        WHERE workspace_id = brand_vault_files.workspace_id AND user_id = auth.uid()
    ));

CREATE POLICY "Editors and above can insert files"
    ON public.brand_vault_files FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.workspace_memberships 
        WHERE workspace_id = brand_vault_files.workspace_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'editor')
    ));

-- RLS Policies for document embeddings
CREATE POLICY "Users can view embeddings in their workspaces"
    ON public.document_embeddings FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.workspace_memberships 
        WHERE workspace_id = document_embeddings.workspace_id AND user_id = auth.uid()
    ));

-- RLS Policies for agent configurations (public read for all authenticated users)
CREATE POLICY "Authenticated users can view agent configurations"
    ON public.agent_configurations FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for chat conversations
CREATE POLICY "Users can view conversations in their workspaces"
    ON public.chat_conversations FOR SELECT
    USING (
        workspace_id IS NULL OR -- For public gimmebot chats
        EXISTS (
            SELECT 1 FROM public.workspace_memberships 
            WHERE workspace_id = chat_conversations.workspace_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations"
    ON public.chat_conversations FOR INSERT
    WITH CHECK (
        workspace_id IS NULL OR -- For public gimmebot chats
        EXISTS (
            SELECT 1 FROM public.workspace_memberships 
            WHERE workspace_id = chat_conversations.workspace_id AND user_id = auth.uid()
        )
    );

-- RLS Policies for chat messages
CREATE POLICY "Users can view messages in accessible conversations"
    ON public.chat_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.chat_conversations cc
        WHERE cc.id = chat_messages.conversation_id
        AND (
            cc.workspace_id IS NULL OR -- Public conversations
            EXISTS (
                SELECT 1 FROM public.workspace_memberships 
                WHERE workspace_id = cc.workspace_id AND user_id = auth.uid()
            )
        )
    ));

CREATE POLICY "Users can create messages in accessible conversations"
    ON public.chat_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.chat_conversations cc
        WHERE cc.id = chat_messages.conversation_id
        AND (
            cc.workspace_id IS NULL OR -- Public conversations
            EXISTS (
                SELECT 1 FROM public.workspace_memberships 
                WHERE workspace_id = cc.workspace_id AND user_id = auth.uid()
            )
        )
    ));

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
        new.id,
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'last_name',
        new.email
    );
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_workspace_memberships_user_workspace ON public.workspace_memberships(user_id, workspace_id);
CREATE INDEX idx_brand_vault_files_workspace ON public.brand_vault_files(workspace_id);
CREATE INDEX idx_document_embeddings_workspace ON public.document_embeddings(workspace_id);
CREATE INDEX idx_document_embeddings_vector ON public.document_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_chat_conversations_user ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);

-- Insert default agent configurations
INSERT INTO public.agent_configurations (agent_type, name, description, system_prompt, model, max_tokens, temperature, tools) VALUES
('gimmebot', 'gimmebot', 'Free marketing assistant available to everyone', 
'You are gimmebot, a friendly and knowledgeable marketing assistant. You help users with marketing questions, strategy advice, content ideas, and general marketing guidance. You are approachable, helpful, and always ready to provide practical marketing insights. Keep your responses conversational and actionable.', 
'gpt-4o', 4000, 0.7, '[]'),

('creative_concept', 'Studio - Creative Concept', 'In-depth creative brainstorming agent with brand context',
'You are a creative marketing strategist specializing in campaign concepts and creative brainstorming. You help users develop comprehensive marketing campaigns, taglines, and creative concepts. You have access to brand context and can generate visual concepts. Always structure your responses with clear sections like Campaign Overview, Key Messages, Visual Concepts, and Implementation Ideas. Be creative, strategic, and brand-focused.',
'gpt-4o', 6000, 0.8, '["image_generation", "brand_vault_search"]'),

('neutral_chat', 'Neutral Chat', 'General purpose AI assistant',
'You are a helpful, general-purpose AI assistant. You can help with a wide variety of tasks and questions. Be informative, accurate, and helpful while maintaining a friendly tone.',
'gpt-4o', 4000, 0.7, '[]');
