
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface KnowledgeBaseTabProps {
  config: any;
  setConfig: (config: any) => void;
}

export default function KnowledgeBaseTab({ config, setConfig }: KnowledgeBaseTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="knowledge-enabled"
            checked={config.knowledge_base.enabled}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              knowledge_base: {
                ...prev.knowledge_base,
                enabled: e.target.checked
              }
            }))}
          />
          <Label htmlFor="knowledge-enabled">Enable Knowledge Base</Label>
        </div>

        {config.knowledge_base.enabled && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chunk-size">Chunk Size (words)</Label>
                <Input
                  id="chunk-size"
                  type="number"
                  value={config.knowledge_base.chunk_size}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    knowledge_base: {
                      ...prev.knowledge_base,
                      chunk_size: parseInt(e.target.value) || 300
                    }
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optimal range: 200-500 words
                </p>
              </div>
              <div>
                <Label htmlFor="chunk-overlap">Chunk Overlap (words)</Label>
                <Input
                  id="chunk-overlap"
                  type="number"
                  value={config.knowledge_base.chunk_overlap}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    knowledge_base: {
                      ...prev.knowledge_base,
                      chunk_overlap: parseInt(e.target.value) || 50
                    }
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usually 10-20% of chunk size
                </p>
              </div>
              <div>
                <Label htmlFor="retrieval-depth">Retrieval Depth</Label>
                <Input
                  id="retrieval-depth"
                  type="number"
                  value={config.knowledge_base.retrieval_depth}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    knowledge_base: {
                      ...prev.knowledge_base,
                      retrieval_depth: parseInt(e.target.value) || 5
                    }
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of relevant chunks to retrieve
                </p>
              </div>
              <div>
                <Label htmlFor="keyword-extraction">Keyword Extraction</Label>
                <Select
                  value={config.knowledge_base.keyword_extraction}
                  onValueChange={(value) => setConfig(prev => ({
                    ...prev,
                    knowledge_base: {
                      ...prev.knowledge_base,
                      keyword_extraction: value
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tfidf">TF-IDF</SelectItem>
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="semantic">Semantic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
