
-- First, let's create the new admin panel tables as specified

-- Create agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('root', 'sub', 'utility')),
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'workspace', 'internal')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_config_versions table
CREATE TABLE public.agent_config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES public.agents(agent_id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT false,
  settings JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, version)
);

-- Create model_catalog table
CREATE TABLE public.model_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modality TEXT NOT NULL CHECK (modality IN ('text', 'image', 'audio', 'video')),
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tool_registry table
CREATE TABLE public.tool_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  function_schema JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add is_admin field to profiles table for admin access control
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_registry ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin-only access
CREATE POLICY "Admin only access to agents"
  ON public.agents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admin only access to agent_config_versions"
  ON public.agent_config_versions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admin only access to model_catalog"
  ON public.model_catalog FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admin only access to tool_registry"
  ON public.tool_registry FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Seed initial agents - map existing agent_configuration types to new schema
INSERT INTO public.agents (agent_id, label, type, visibility) VALUES
('gimmebot', 'gimmebot', 'root', 'public'),
('creative_concept', 'Creative Concept', 'sub', 'workspace'),
('neutral_chat', 'Neutral Chat', 'root', 'workspace');

-- Seed model catalog with common models
INSERT INTO public.model_catalog (modality, provider, model_name) VALUES
('text', 'openai', 'gpt-4o'),
('text', 'openai', 'gpt-4o-mini'),
('text', 'openai', 'gpt-4-turbo'),
('image', 'openai', 'dall-e-3'),
('image', 'openai', 'dall-e-2');

-- Seed tool registry with common tools
INSERT INTO public.tool_registry (name, description, function_schema, enabled) VALUES
('BrandVaultSearch', 'Search through brand vault documents', '{"type": "function", "function": {"name": "BrandVaultSearch", "description": "Search brand vault"}}', true),
('GenerateImage', 'Generate images using AI', '{"type": "function", "function": {"name": "GenerateImage", "description": "Generate images"}}', true);

-- Migrate existing agent_configurations to new schema
INSERT INTO public.agent_config_versions (agent_id, version, is_active, settings, created_at)
SELECT 
  agent_type::text,
  1,
  true,
  jsonb_build_object(
    'model', jsonb_build_object(
      'text', jsonb_build_object('provider', 'openai', 'model', model),
      'image', jsonb_build_object('provider', 'openai', 'model', 'dall-e-3'),
      'audio', jsonb_build_object('provider', null, 'model', null),
      'video', jsonb_build_object('provider', null, 'model', null)
    ),
    'generation', jsonb_build_object(
      'max_context_tokens', 8000,
      'max_response_tokens', max_tokens,
      'temperature', temperature,
      'top_p', 1
    ),
    'prompt', system_prompt,
    'tools', COALESCE(tools::jsonb, '[]'::jsonb),
    'knowledge_base', jsonb_build_object(
      'enabled', true,
      'vector_store_id', null,
      'chunk_size', 300,
      'chunk_overlap', 50,
      'retrieval_depth', 5,
      'keyword_extraction', 'tfidf'
    ),
    'agent_as_tool', jsonb_build_object(
      'expose', false,
      'function_name', '',
      'signature', '{}'::jsonb
    ),
    'router', jsonb_build_object(
      'strategy', 'manual',
      'default_child', null
    )
  ),
  created_at
FROM public.agent_configurations
WHERE is_active = true;

-- Add the studio hub agent after migration
INSERT INTO public.agents (agent_id, label, type, visibility) VALUES
('studio', 'Studio (hub)', 'root', 'workspace');

-- Create indexes for better performance
CREATE INDEX idx_agents_agent_id ON public.agents(agent_id);
CREATE INDEX idx_agent_config_versions_agent_id ON public.agent_config_versions(agent_id);
CREATE INDEX idx_agent_config_versions_active ON public.agent_config_versions(agent_id, is_active) WHERE is_active = true;
CREATE INDEX idx_model_catalog_modality_provider ON public.model_catalog(modality, provider);
CREATE INDEX idx_tool_registry_enabled ON public.tool_registry(enabled) WHERE enabled = true;
