
-- First, let's check if we have the proper RLS policies for knowledge base operations
-- and ensure they allow authenticated users to manage their own documents

-- Enable RLS if not already enabled
ALTER TABLE public.knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view documents in their workspace" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can update their documents" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can delete their documents" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can view chunks from their documents" ON public.knowledge_base_chunks;
DROP POLICY IF EXISTS "Service role can manage all chunks" ON public.knowledge_base_chunks;
DROP POLICY IF EXISTS "Users can upload to knowledge base" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their knowledge base files" ON storage.objects;

-- Create more permissive policies for knowledge base documents
CREATE POLICY "Users can view all documents they uploaded"
    ON public.knowledge_base_documents FOR SELECT
    USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can upload documents"
    ON public.knowledge_base_documents FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their documents"
    ON public.knowledge_base_documents FOR UPDATE
    USING (auth.uid() = uploaded_by);

CREATE POLICY "Service role can update any document"
    ON public.knowledge_base_documents FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can delete their documents"
    ON public.knowledge_base_documents FOR DELETE
    USING (auth.uid() = uploaded_by);

-- RLS Policies for knowledge_base_chunks
CREATE POLICY "Users can view chunks from their documents"
    ON public.knowledge_base_chunks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.knowledge_base_documents kd
        WHERE kd.id = knowledge_base_chunks.document_id
        AND kd.uploaded_by = auth.uid()
    ));

CREATE POLICY "Service role can manage all chunks"
    ON public.knowledge_base_chunks FOR ALL
    USING (auth.role() = 'service_role');

-- Storage policies for knowledge-base bucket (create bucket if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'knowledge-base',
    'knowledge-base',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload to knowledge base"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their knowledge base files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their knowledge base files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can access all knowledge base files"
    ON storage.objects FOR ALL
    USING (bucket_id = 'knowledge-base' AND auth.role() = 'service_role');
