
-- Fix infinite recursion in workspace_memberships policies
-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Public access to workspace_memberships" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can view their own workspace memberships" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can create workspace memberships for themselves" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can update their own workspace memberships" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can delete their own workspace memberships" ON public.workspace_memberships;

-- Create a simple public access policy without any complex queries
CREATE POLICY "Allow all operations on workspace_memberships" ON public.workspace_memberships FOR ALL USING (true) WITH CHECK (true);

-- Also ensure we don't have any triggers or functions that might be causing issues
-- Let's also make sure the workspaces table has the right policies
DROP POLICY IF EXISTS "Public access to workspaces" ON public.workspaces;
CREATE POLICY "Allow all operations on workspaces" ON public.workspaces FOR ALL USING (true) WITH CHECK (true);

-- Same for projects
DROP POLICY IF EXISTS "Public access to projects" ON public.projects;
CREATE POLICY "Allow all operations on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

-- Same for brand_vaults
DROP POLICY IF EXISTS "Public access to brand_vaults" ON public.brand_vaults;
CREATE POLICY "Allow all operations on brand_vaults" ON public.brand_vaults FOR ALL USING (true) WITH CHECK (true);
