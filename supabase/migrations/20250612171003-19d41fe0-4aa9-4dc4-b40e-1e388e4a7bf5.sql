
-- Create table for storing API keys securely
CREATE TABLE IF NOT EXISTS public.api_keys_storage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys_storage ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin access to API keys" ON public.api_keys_storage
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_api_keys_storage_updated_at 
    BEFORE UPDATE ON public.api_keys_storage 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
