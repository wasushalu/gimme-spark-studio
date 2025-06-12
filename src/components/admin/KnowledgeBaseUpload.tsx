
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertCircle, Type, X } from 'lucide-react';

interface KnowledgeBaseUploadProps {
  agentId: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export default function KnowledgeBaseUpload({ agentId }: KnowledgeBaseUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleMultipleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    console.log('Starting file upload for agent:', agentId);
    console.log('Files to upload:', files.map(f => f.name));

    // Validate all files first
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    const oversizedFiles = files.filter(file => file.size > 52428800);

    if (invalidFiles.length > 0) {
      toast({
        title: 'Invalid file types',
        description: `${invalidFiles.length} file(s) have invalid types. Please upload only PDF, TXT, MD, or DOCX files.`,
        variant: 'destructive',
      });
      return;
    }

    if (oversizedFiles.length > 0) {
      toast({
        title: 'Files too large',
        description: `${oversizedFiles.length} file(s) exceed 50MB limit.`,
        variant: 'destructive',
      });
      return;
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to upload documents.',
        variant: 'destructive',
      });
      return;
    }

    console.log('User authenticated:', user.id);

    // Initialize uploading files state
    const initialUploadingFiles = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(initialUploadingFiles);

    let successCount = 0;
    let errorCount = 0;

    // Process files sequentially to avoid overwhelming the system
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        await uploadSingleFile(file, i, user.id);
        successCount++;
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        errorCount++;
        setUploadingFiles(prev => prev.map((uploadingFile, index) => 
          index === i 
            ? { ...uploadingFile, status: 'error', error: 'Upload failed: ' + (error as Error).message }
            : uploadingFile
        ));
      }
    }

    // Refresh the documents list
    queryClient.invalidateQueries({ queryKey: ['knowledge-base-documents', agentId] });

    // Reset file input
    event.target.value = '';

    // Show completion toast
    if (successCount > 0) {
      toast({
        title: `${successCount} document(s) uploaded successfully`,
        description: 'Your documents are being processed and will be available shortly.',
      });
    }

    if (errorCount > 0) {
      toast({
        title: `${errorCount} document(s) failed to upload`,
        description: 'Please try uploading the failed documents again.',
        variant: 'destructive',
      });
    }

    // Clear uploading files after a delay
    setTimeout(() => {
      setUploadingFiles([]);
    }, 3000);
  };

  const uploadSingleFile = async (file: File, index: number, userId: string) => {
    console.log(`Starting upload for file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    // Update progress: starting upload
    setUploadingFiles(prev => prev.map((uploadingFile, i) => 
      i === index ? { ...uploadingFile, progress: 10 } : uploadingFile
    ));

    // Create document title from filename (remove extension)
    const documentTitle = file.name.replace(/\.[^/.]+$/, "");

    // Upload file to storage
    const filePath = `${userId}/${agentId}/${Date.now()}_${file.name}`;
    console.log('Uploading to storage path:', filePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('knowledge-base')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded to storage successfully:', uploadData.path);

    // Update progress: file uploaded
    setUploadingFiles(prev => prev.map((uploadingFile, i) => 
      i === index ? { ...uploadingFile, progress: 40 } : uploadingFile
    ));

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

    // Create document record with title
    console.log('Creating document record for agent:', agentId);
    const { data: docData, error: docError } = await supabase
      .from('knowledge_base_documents')
      .insert({
        agent_id: agentId,
        filename: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        content_type: getContentType(file.name),
        uploaded_by: userId,
        status: 'processing'
      })
      .select('id')
      .single();

    if (docError) {
      console.error('Document record creation error:', docError);
      throw new Error(`Document record failed: ${docError.message}`);
    }

    console.log('Document record created:', docData.id);

    // Update progress: document record created
    setUploadingFiles(prev => prev.map((uploadingFile, i) => 
      i === index ? { ...uploadingFile, progress: 70, status: 'processing' } : uploadingFile
    ));

    // Process document using edge function
    console.log('Starting document processing via edge function');
    const { data: processData, error: processError } = await supabase.functions.invoke('process-document', {
      body: {
        documentId: docData.id,
        filePath: uploadData.path,
        agentId: agentId,
        documentTitle: documentTitle, // Pass the title for better search
      },
    });

    if (processError) {
      console.error('Document processing error:', processError);
      throw new Error(`Processing failed: ${processError.message}`);
    }

    console.log('Document processed successfully:', processData);

    // Update progress: completed
    setUploadingFiles(prev => prev.map((uploadingFile, i) => 
      i === index ? { ...uploadingFile, progress: 100, status: 'completed' } : uploadingFile
    ));
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) {
      toast({
        title: 'No content',
        description: 'Please enter some text content.',
        variant: 'destructive',
      });
      return;
    }

    if (!textTitle.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your text content.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Starting text upload for agent:', agentId);
    console.log('Text title:', textTitle);
    console.log('Text length:', textContent.length);

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to upload text content.',
        variant: 'destructive',
      });
      return;
    }

    const uploadingFile: UploadingFile = {
      file: new File([textContent], `${textTitle}.txt`, { type: 'text/plain' }),
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles([uploadingFile]);

    try {
      // Create a text blob and upload it
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const fileName = `${textTitle}.txt`;
      const filePath = `${user.id}/${agentId}/${Date.now()}_${fileName}`;

      console.log('Uploading text to storage path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, textBlob);

      if (uploadError) {
        console.error('Text storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log('Text uploaded to storage successfully:', uploadData.path);

      setUploadingFiles([{ ...uploadingFile, progress: 30 }]);

      // Create document record
      console.log('Creating text document record for agent:', agentId);
      const { data: docData, error: docError } = await supabase
        .from('knowledge_base_documents')
        .insert({
          agent_id: agentId,
          filename: fileName,
          file_path: uploadData.path,
          file_size: textBlob.size,
          mime_type: 'text/plain',
          content_type: 'text',
          uploaded_by: user.id,
          status: 'processing'
        })
        .select('id')
        .single();

      if (docError) {
        console.error('Text document record creation error:', docError);
        throw new Error(`Document record failed: ${docError.message}`);
      }

      console.log('Text document record created:', docData.id);

      setUploadingFiles([{ ...uploadingFile, progress: 60, status: 'processing' }]);

      // Process document using edge function
      console.log('Starting text processing via edge function');
      const { data: processData, error: processError } = await supabase.functions.invoke('process-document', {
        body: {
          documentId: docData.id,
          filePath: uploadData.path,
          agentId: agentId,
          documentTitle: textTitle, // Pass the title for better search
        },
      });

      if (processError) {
        console.error('Text processing error:', processError);
        throw new Error(`Processing failed: ${processError.message}`);
      }

      console.log('Text processed successfully:', processData);

      setUploadingFiles([{ ...uploadingFile, progress: 100, status: 'completed' }]);

      toast({
        title: 'Text content uploaded successfully',
        description: 'Your text is being processed and will be available shortly.',
      });

      // Refresh the documents list
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-documents', agentId] });

      // Reset form
      setTextContent('');
      setTextTitle('');

      // Clear uploading files after a delay
      setTimeout(() => {
        setUploadingFiles([]);
      }, 3000);

    } catch (error) {
      console.error('Text upload error:', error);
      setUploadingFiles([{ ...uploadingFile, status: 'error', error: 'Upload failed: ' + (error as Error).message }]);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload text content. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Knowledge Base Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Paste Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div>
              <Label htmlFor="document-upload">Select Files</Label>
              <Input
                id="document-upload"
                type="file"
                onChange={handleMultipleFileUpload}
                disabled={uploadingFiles.length > 0}
                accept=".pdf,.txt,.md,.docx"
                multiple
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: PDF, TXT, MD, DOCX (max 50MB each). You can select multiple files.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div>
              <Label htmlFor="text-title">Title</Label>
              <Input
                id="text-title"
                type="text"
                placeholder="Enter a title for your text content"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                disabled={uploadingFiles.length > 0}
              />
            </div>
            <div>
              <Label htmlFor="text-content">Text Content</Label>
              <Textarea
                id="text-content"
                placeholder="Paste your text content here... You can add large volumes of text, documentation, or any textual information you want to include in the knowledge base."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={uploadingFiles.length > 0}
                className="min-h-[200px] resize-y"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Character count: {textContent.length}
              </p>
            </div>
            <Button 
              onClick={handleTextUpload} 
              disabled={uploadingFiles.length > 0 || !textContent.trim() || !textTitle.trim()}
              className="w-full"
            >
              {uploadingFiles.length > 0 ? 'Processing...' : 'Upload Text Content'}
            </Button>
          </TabsContent>
        </Tabs>

        {uploadingFiles.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-medium">Upload Progress</h4>
            {uploadingFiles.map((uploadingFile, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{uploadingFile.file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs capitalize text-muted-foreground">
                      {uploadingFile.status}
                    </span>
                    {(uploadingFile.status === 'completed' || uploadingFile.status === 'error') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <Progress value={uploadingFile.progress} className="w-full" />
                {uploadingFile.error && (
                  <p className="text-xs text-destructive mt-1">{uploadingFile.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mt-4">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Processing Information</p>
            <p>Content is automatically chunked and embedded for optimal retrieval. Document titles (filename without extension) are used for search matching. This process may take a few minutes for larger content.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
