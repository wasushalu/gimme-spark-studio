
import KnowledgeBaseUpload from '../KnowledgeBaseUpload';
import KnowledgeBaseDocuments from '../KnowledgeBaseDocuments';

interface DocumentsTabProps {
  agentId: string;
}

export default function DocumentsTab({ agentId }: DocumentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-6">
        <KnowledgeBaseUpload agentId={agentId} />
        <KnowledgeBaseDocuments agentId={agentId} />
      </div>
    </div>
  );
}
