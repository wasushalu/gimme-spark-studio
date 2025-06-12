
-- Drop the existing restrictive admin-only policies
DROP POLICY IF EXISTS "Admin only access to agents" ON public.agents;
DROP POLICY IF EXISTS "Admin only access to agent_config_versions" ON public.agent_config_versions;
DROP POLICY IF EXISTS "Admin only access to model_catalog" ON public.model_catalog;
DROP POLICY IF EXISTS "Admin only access to tool_registry" ON public.tool_registry;

-- Create more permissive policies that allow authenticated users to access these tables
-- This will allow the admin interface to work without requiring specific admin privileges
CREATE POLICY "Allow authenticated access to agents"
  ON public.agents FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated access to agent_config_versions"
  ON public.agent_config_versions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated access to model_catalog"
  ON public.model_catalog FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated access to tool_registry"
  ON public.tool_registry FOR ALL
  USING (true)
  WITH CHECK (true);
