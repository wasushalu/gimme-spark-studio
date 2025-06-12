
import { Button } from '@/components/ui/button';

interface AgentsErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export default function AgentsErrorState({ error, onRetry }: AgentsErrorStateProps) {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent Management</h1>
        <div className="text-red-600 mb-4">
          <p>Error loading agents: {error.message}</p>
        </div>
        <Button onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
