
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface KnowledgeBaseUploadProps {
  agentId: string;
}

export default function KnowledgeBaseUpload({ agentId }: KnowledgeBaseUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, TXT, MD, or DOCX file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 52428800) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 50MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const filePath = `${user.id}/${agentId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(30);

      // Get content type from file extension
      const getContentType = (fileName: string) => {
        const ext = fileName.toLowerCase().split('.').pop();
        switch (ext) {
          case 'pdf': return 'pdf';
          case 'txt': return 'text';
          case 'md': return 'markdown';
          case 'docx': return 'docx';
          default: return 'text';
        }
      };

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('knowledge_base_documents')
        .insert({
          agent_id: agentId,
          filename: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          content_type: getContentType(file.name),
          uploaded_by: user.id,
        })
        .select('id')
        .single();

      if (docError) throw docError;

      setProgress(60);

      // Process document using edge function
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: {
          documentId: docData.id,
          filePath: uploadData.path,
          agentId: agentId,
        },
      });

      if (processError) throw processError;

      setProgress(100);

      toast({
        title: 'Document uploaded successfully',
        description: 'Your document is being processed and will be available shortly.',
      });

      // Refresh the documents list
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-documents', agentId] });

      // Reset file input
      event.target.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="document-upload">Select File</Label>
          <Input
            id="document-upload"
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            accept=".pdf,.txt,.md,.docx"
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Supported formats: PDF, TXT, MD, DOCX (max 50MB)
          </p>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Processing document...</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Processing Information</p>
            <p>Documents are automatically chunked and embedded for optimal retrieval. This process may take a few minutes for larger files.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
