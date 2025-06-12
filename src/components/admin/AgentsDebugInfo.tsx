
interface Agent {
  id: string;
  agent_id: string;
  label: string;
  type: 'root' | 'sub' | 'utility';
  visibility: 'public' | 'workspace' | 'internal';
  created_at: string;
}

interface AgentsDebugInfoProps {
  agents: Agent[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export default function AgentsDebugInfo({ agents, isLoading, error }: AgentsDebugInfoProps) {
  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg">
      <h3 className="font-semibold mb-2">Debug Info:</h3>
      <p>Agents count: {agents?.length || 0}</p>
      <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      <p>Error: {error ? error.message : 'None'}</p>
      {agents && agents.length > 0 && (
        <div className="mt-2">
          <p>Sample agent IDs: {agents.slice(0, 3).map(a => a.agent_id).join(', ')}</p>
        </div>
      )}
    </div>
  );
}
