
-- Fix the model names that were incorrectly updated
UPDATE public.model_catalog 
SET model_name = 'gpt-4o-mini' 
WHERE model_name = 'o4-mini-2025-04-16';

UPDATE public.model_catalog 
SET model_name = 'gpt-4o' 
WHERE model_name = 'gpt-4.1-2025-04-14';

-- Remove the incorrect entries if they exist
DELETE FROM public.model_catalog 
WHERE model_name IN ('gpt-4.1-2025-04-14', 'o4-mini-2025-04-16', 'o3-2025-04-16');

-- Update any existing agent configurations to use the correct model names
UPDATE public.agent_config_versions 
SET settings = jsonb_set(
  settings, 
  '{model,text,model}', 
  '"gpt-4o"'::jsonb
)
WHERE settings->'model'->'text'->>'model' = 'gpt-4.1-2025-04-14';

UPDATE public.agent_config_versions 
SET settings = jsonb_set(
  settings, 
  '{model,text,model}', 
  '"gpt-4o-mini"'::jsonb
)
WHERE settings->'model'->'text'->>'model' IN ('o4-mini-2025-04-16', 'o3-2025-04-16');
