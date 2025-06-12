
-- Add Perplexity models
INSERT INTO public.model_catalog (modality, provider, model_name) VALUES
('text', 'perplexity', 'llama-3.1-sonar-small-128k-online'),
('text', 'perplexity', 'llama-3.1-sonar-large-128k-online'),
('text', 'perplexity', 'llama-3.1-sonar-huge-128k-online'),

-- Add ElevenLabs voice models
('audio', 'elevenlabs', 'eleven_multilingual_v2'),
('audio', 'elevenlabs', 'eleven_turbo_v2_5'),
('audio', 'elevenlabs', 'eleven_turbo_v2'),
('audio', 'elevenlabs', 'eleven_multilingual_v1'),
('audio', 'elevenlabs', 'eleven_multilingual_sts_v2'),
('audio', 'elevenlabs', 'eleven_monolingual_v1'),
('audio', 'elevenlabs', 'eleven_english_sts_v2'),

-- Add video models for completeness
('video', 'openai', 'sora'),
('video', 'runway', 'gen-3-alpha'),
('video', 'google', 'imagen-video')

ON CONFLICT (provider, model_name) DO NOTHING;
