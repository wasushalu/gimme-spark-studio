
-- Create workspaces table (if not exists, but we'll make sure it has the right structure)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_vaults table
CREATE TABLE IF NOT EXISTS public.brand_vaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_vaults ENABLE ROW LEVEL SECURITY;

-- Create policies for workspaces (public read for now, can be restricted later)
CREATE POLICY "Anyone can view workspaces" ON public.workspaces
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update workspaces" ON public.workspaces
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete workspaces" ON public.workspaces
  FOR DELETE USING (true);

-- Create policies for projects
CREATE POLICY "Anyone can view projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create projects" ON public.projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update projects" ON public.projects
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete projects" ON public.projects
  FOR DELETE USING (true);

-- Create policies for brand_vaults
CREATE POLICY "Anyone can view brand_vaults" ON public.brand_vaults
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create brand_vaults" ON public.brand_vaults
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update brand_vaults" ON public.brand_vaults
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete brand_vaults" ON public.brand_vaults
  FOR DELETE USING (true);

-- Insert default workspace and data if it doesn't exist
INSERT INTO public.workspaces (id, name, description) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Workspace', 'Your default workspace')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, workspace_id, name, description)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Marketing Campaign', 'Default marketing project'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Product Launch', 'Default product launch project')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.brand_vaults (id, project_id, name, description)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Brand Guidelines', 'Brand guidelines vault'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Asset Library', 'Asset library vault'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Launch Assets', 'Launch assets vault')
ON CONFLICT (id) DO NOTHING;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_vaults_updated_at BEFORE UPDATE ON public.brand_vaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
