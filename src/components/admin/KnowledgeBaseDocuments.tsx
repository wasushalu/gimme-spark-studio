
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Download, Eye, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeBaseDocument } from '@/types/database';
import DocumentChunks from './DocumentChunks';

interface KnowledgeBaseDocumentsProps {
  agentId: string;
}

export default function KnowledgeBaseDocuments({ agentId }: KnowledgeBaseDocumentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['knowledge-base-documents', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base_documents')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as KnowledgeBaseDocument[];
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('knowledge_base_documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Document deleted',
        description: 'The document has been removed from the knowledge base.',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-documents', agentId] });
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const downloadDocument = async (document: KnowledgeBaseDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('knowledge-base')
        .download(document.file_path);
      
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Eye className="w-4 h-4" />;
      case 'processing': return <FileText className="w-4 h-4 animate-pulse" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base Documents</CardTitle>
        <p className="text-sm text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
        </p>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No documents uploaded yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Upload documents above to build your knowledge base.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div key={document.id} className="border rounded-lg">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(document.status)}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{document.filename}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {document.content_type.toUpperCase()}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(document.status)}`}>
                          {document.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(document.file_size)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(document.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(document)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDocumentMutation.mutate(document.id)}
                      disabled={deleteDocumentMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {document.status === 'completed' && (
                  <DocumentChunks 
                    documentId={document.id} 
                    filename={document.filename}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
