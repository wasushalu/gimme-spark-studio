
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, ChevronDown, ChevronUp, Copy, Eye } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const [showFullText, setShowFullText] = useState(false);
  const { toast } = useToast();

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

  const fullExtractedText = chunks.map(chunk => chunk.content).join('\n\n');

  const copyFullText = () => {
    navigator.clipboard.writeText(fullExtractedText);
    toast({
      title: 'Copied to clipboard',
      description: 'Full extracted text has been copied to your clipboard.',
    });
  };

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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {isExpanded ? 'Hide' : 'View'} Content Details
          {chunks.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {chunks.length} chunks
            </Badge>
          )}
        </Button>

        {chunks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullText(!showFullText)}
            className="flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            {showFullText ? 'Hide' : 'Show'} Full Text
          </Button>
        )}
      </div>

      {showFullText && chunks.length > 0 && (
        <Card className="mt-3 border-l-4 border-l-green-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Extracted Text from {filename}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyFullText}
                className="flex items-center gap-2"
              >
                <Copy className="w-3 h-3" />
                Copy All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={fullExtractedText}
              readOnly
              className="min-h-[300px] text-sm font-mono"
              placeholder="No text extracted yet..."
            />
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Total characters: {fullExtractedText.length.toLocaleString()}</span>
              <span>Word count: ~{Math.round(fullExtractedText.split(/\s+/).length)}</span>
              <span>Chunks: {chunks.length}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {chunks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No chunks found for this document.</p>
              <p className="text-xs mt-1">The document may still be processing.</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-3">
                Content broken into {chunks.length} searchable chunks for optimal retrieval
              </div>
              {chunks.map((chunk) => (
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
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {chunk.content}
                    </div>
                    {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-xs font-medium text-gray-500 mb-2">Metadata:</h5>
                        <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(chunk.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
