
-- Drop existing restrictive policies on workspaces
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;

-- Drop existing restrictive policies on workspace_memberships
DROP POLICY IF EXISTS "Users can view their own workspace memberships" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can create workspace memberships for themselves" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can update their own workspace memberships" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Users can delete their own workspace memberships" ON public.workspace_memberships;

-- Drop existing restrictive policies on projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Drop existing restrictive policies on brand_vaults
DROP POLICY IF EXISTS "Users can view their own brand_vaults" ON public.brand_vaults;
DROP POLICY IF EXISTS "Users can create their own brand_vaults" ON public.brand_vaults;
DROP POLICY IF EXISTS "Users can update their own brand_vaults" ON public.brand_vaults;
DROP POLICY IF EXISTS "Users can delete their own brand_vaults" ON public.brand_vaults;

-- Drop existing restrictive policies on chat_conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.chat_conversations;

-- Drop existing restrictive policies on chat_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;

-- Create public access policies for all tables
CREATE POLICY "Public access to workspaces" ON public.workspaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to workspace_memberships" ON public.workspace_memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to brand_vaults" ON public.brand_vaults FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to chat_conversations" ON public.chat_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
