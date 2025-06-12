
-- Create table for storing uploaded documents
CREATE TABLE IF NOT EXISTS public.knowledge_base_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('pdf', 'text', 'docx', 'markdown')),
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing processed text chunks
CREATE TABLE IF NOT EXISTS public.knowledge_base_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.knowledge_base_documents(id) ON DELETE CASCADE NOT NULL,
    agent_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    char_count INTEGER NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimensions
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for knowledge base documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'knowledge-base',
    'knowledge-base',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view documents in their workspace" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can update their documents" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can delete their documents" ON public.knowledge_base_documents;
DROP POLICY IF EXISTS "Users can view chunks from their documents" ON public.knowledge_base_chunks;
DROP POLICY IF EXISTS "Users can upload to knowledge base" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their knowledge base files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their knowledge base files" ON storage.objects;

-- RLS Policies for knowledge_base_documents
CREATE POLICY "Users can view documents in their workspace"
    ON public.knowledge_base_documents FOR SELECT
    USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can upload documents"
    ON public.knowledge_base_documents FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their documents"
    ON public.knowledge_base_documents FOR UPDATE
    USING (auth.uid() = uploaded_by);

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

-- Storage policies for knowledge-base bucket
CREATE POLICY "Users can upload to knowledge base"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their knowledge base files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their knowledge base files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_agent_id ON public.knowledge_base_documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_status ON public.knowledge_base_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_chunks_document_id ON public.knowledge_base_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_chunks_agent_id ON public.knowledge_base_chunks(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_chunks_embedding ON public.knowledge_base_chunks USING ivfflat (embedding vector_cosine_ops);
