
-- Add visual recognition models to the model catalog
INSERT INTO public.model_catalog (modality, provider, model_name) VALUES
-- OpenAI vision models
('image', 'openai', 'gpt-4o'),
('image', 'openai', 'gpt-4o-mini'),
('image', 'openai', 'gpt-4-turbo'),

-- Google vision models
('image', 'google', 'gemini-pro-vision'),
('image', 'google', 'gemini-1.5-pro'),
('image', 'google', 'gemini-1.5-flash'),

-- Anthropic vision models
('image', 'anthropic', 'claude-3-opus'),
('image', 'anthropic', 'claude-3-sonnet'),
('image', 'anthropic', 'claude-3-haiku'),

-- Additional video models
('video', 'google', 'gemini-video'),
('video', 'anthropic', 'claude-video'),
('video', 'meta', 'llama-video'),
('video', 'microsoft', 'phi-3-vision')

ON CONFLICT (provider, model_name) DO NOTHING;

-- Update the agent config settings to include video and vision model configurations in existing configs
UPDATE public.agent_config_versions 
SET settings = settings || jsonb_build_object(
  'model', settings->'model' || jsonb_build_object(
    'video', jsonb_build_object('provider', 'openai', 'model', 'sora'),
    'vision', jsonb_build_object('provider', 'openai', 'model', 'gpt-4o')
  )
)
WHERE settings->'model' IS NOT NULL 
AND (settings->'model'->'video' IS NULL OR settings->'model'->'vision' IS NULL);
