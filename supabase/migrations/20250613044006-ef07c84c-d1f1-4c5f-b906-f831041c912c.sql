
-- Drop existing policies that are causing infinite recursion
DROP POLICY IF EXISTS "Users can view workspace memberships" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can create workspace memberships" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can update workspace memberships" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can delete workspace memberships" ON public.workspace_memberships;

-- Create proper RLS policies for workspace_memberships without recursion
CREATE POLICY "Users can view their own workspace memberships" 
  ON public.workspace_memberships 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create workspace memberships for themselves" 
  ON public.workspace_memberships 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspace memberships" 
  ON public.workspace_memberships 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspace memberships" 
  ON public.workspace_memberships 
  FOR DELETE 
  USING (auth.uid() = user_id);
