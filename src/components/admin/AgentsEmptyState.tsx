
import { Button } from '@/components/ui/button';
import { Bot, Plus } from 'lucide-react';

interface AgentsEmptyStateProps {
  onRefresh: () => void;
  onCreateTestAgent: () => void;
}

export default function AgentsEmptyState({ onRefresh, onCreateTestAgent }: AgentsEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
      <p className="text-gray-500 mb-4">The database appears to be empty. Try creating a test agent or check the database connection.</p>
      <div className="flex gap-2 justify-center">
        <Button onClick={onRefresh}>
          Refresh
        </Button>
        <Button onClick={onCreateTestAgent}>
          <Plus className="w-4 h-4 mr-2" />
          Create Test Agent
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>
    </div>
  );
}
