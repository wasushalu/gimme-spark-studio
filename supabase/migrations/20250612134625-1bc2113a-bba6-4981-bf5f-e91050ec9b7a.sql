
-- Add the missing gpt-image-1 model from OpenAI
INSERT INTO public.model_catalog (modality, provider, model_name) VALUES
('image', 'openai', 'gpt-image-1')
ON CONFLICT (provider, model_name) DO NOTHING;
