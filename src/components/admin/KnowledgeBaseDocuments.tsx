
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Trash2, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeBaseDocumentsProps {
  agentId: string;
}

interface Document {
  id: string;
  filename: string;
  file_size: number;
  content_type: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  file_path: string;
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
      return data as Document[];
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const document = documents.find(d => d.id === documentId);
      if (!document) throw new Error('Document not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('knowledge-base')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database (chunks will be deleted via CASCADE)
      const { error: dbError } = await supabase
        .from('knowledge_base_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast({
        title: 'Document deleted',
        description: 'Document and all associated chunks have been removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-base-documents', agentId] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('knowledge-base')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download document.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No documents uploaded yet.</p>
            <p className="text-sm">Upload documents to build the knowledge base for this agent.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{document.filename}</h4>
                      <Badge className={getStatusColor(document.status)}>
                        {getStatusIcon(document.status)}
                        {document.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(document.file_size)} • {document.content_type.toUpperCase()} • 
                      Uploaded {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
