
-- First, create a unique constraint on provider and model_name combination
ALTER TABLE public.model_catalog 
ADD CONSTRAINT unique_provider_model UNIQUE (provider, model_name);

-- Now add the models with the correct ON CONFLICT clause
INSERT INTO public.model_catalog (modality, provider, model_name) VALUES
-- OpenAI models
('text', 'openai', 'gpt-4.1-2025-04-14'),
('text', 'openai', 'o3-2025-04-16'),
('text', 'openai', 'o4-mini-2025-04-16'),
('text', 'openai', 'gpt-3.5-turbo'),
('image', 'openai', 'dall-e-3'),
('image', 'openai', 'dall-e-2'),

-- Anthropic models
('text', 'anthropic', 'claude-opus-4-20250514'),
('text', 'anthropic', 'claude-sonnet-4-20250514'),
('text', 'anthropic', 'claude-3-5-haiku-20241022'),
('text', 'anthropic', 'claude-3-5-sonnet-20241022'),
('text', 'anthropic', 'claude-3-opus-20240229'),

-- Google models
('text', 'google', 'gemini-pro'),
('text', 'google', 'gemini-1.5-pro'),
('image', 'google', 'imagen-2'),

-- Other providers
('text', 'mistral', 'mistral-large'),
('text', 'cohere', 'command-r-plus')

ON CONFLICT (provider, model_name) DO NOTHING;
