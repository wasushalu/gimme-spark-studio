
-- Remove models that don't have publicly accessible APIs
DELETE FROM public.model_catalog WHERE model_name IN (
  'sora',                    -- No public API yet
  'gen-3-alpha',            -- Limited access API
  'imagen-video',           -- Limited access
  'imagen-2'                -- Limited access
);

-- Update some model names to be more accurate
UPDATE public.model_catalog 
SET model_name = 'gpt-4o-mini' 
WHERE model_name = 'o4-mini-2025-04-16';

UPDATE public.model_catalog 
SET model_name = 'gpt-4o' 
WHERE model_name = 'gpt-4.1-2025-04-14';

-- Add some missing accessible models
INSERT INTO public.model_catalog (modality, provider, model_name) VALUES
-- More accessible OpenAI models
('text', 'openai', 'gpt-4o-mini'),
('text', 'openai', 'gpt-4o'),
('audio', 'openai', 'whisper-1'),
('audio', 'openai', 'tts-1'),
('audio', 'openai', 'tts-1-hd'),

-- Accessible Google models
('text', 'google', 'gemini-1.5-flash'),

-- More Anthropic models that are actually available
('text', 'anthropic', 'claude-3-5-sonnet-20241022'),
('text', 'anthropic', 'claude-3-5-haiku-20241022')

ON CONFLICT (provider, model_name) DO NOTHING;
