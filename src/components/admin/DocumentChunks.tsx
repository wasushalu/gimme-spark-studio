
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface DatabaseChunk {
  id: string;
  document_id: string;
  agent_id: string;
  chunk_index: number;
  content: string;
  word_count: number;
  char_count: number;
  embedding: string | null;
  metadata: any;
  created_at: string;
}

interface DocumentChunksProps {
  documentId: string;
  filename: string;
}

export default function DocumentChunks({ documentId, filename }: DocumentChunksProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: chunks = [], isLoading } = useQuery({
    queryKey: ['document-chunks', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_base_chunks')
        .select('*')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true });
      
      if (error) throw error;
      return data as DatabaseChunk[];
    },
    enabled: isExpanded
  });

  if (isLoading && isExpanded) {
    return (
      <div className="ml-4 mt-2">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ml-4 mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm"
      >
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {isExpanded ? 'Hide' : 'View'} Content Chunks
        {chunks.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {chunks.length}
          </Badge>
        )}
      </Button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {chunks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No chunks found for this document.</p>
            </div>
          ) : (
            chunks.map((chunk) => (
              <Card key={chunk.id} className="border-l-4 border-l-blue-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Chunk #{chunk.chunk_index + 1}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {chunk.word_count} words
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {chunk.char_count} chars
                      </Badge>
                      {chunk.embedding && (
                        <Badge variant="secondary" className="text-xs">
                          Embedded
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {chunk.content}
                  </div>
                  {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-xs font-medium text-gray-500 mb-2">Metadata:</h5>
                      <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {JSON.stringify(chunk.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
