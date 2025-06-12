
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AgentConfigForm from '@/components/admin/AgentConfigForm';
import AgentCard from '@/components/admin/AgentCard';
import AgentsEmptyState from '@/components/admin/AgentsEmptyState';
import AgentsDebugInfo from '@/components/admin/AgentsDebugInfo';
import AgentsLoadingState from '@/components/admin/AgentsLoadingState';
import AgentsErrorState from '@/components/admin/AgentsErrorState';
import { useAgents } from '@/hooks/useAgents';
import { useAgentActions } from '@/hooks/useAgentActions';

interface Agent {
  id: string;
  agent_id: string;
  label: string;
  type: 'root' | 'sub' | 'utility';
  visibility: 'public' | 'workspace' | 'internal';
  created_at: string;
}

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);

  const { data: agents, isLoading, error, refetch } = useAgents();
  const { deleteAgent, createTestAgent } = useAgentActions();

  const handleDeleteAgent = async (agentId: string) => {
    const success = await deleteAgent(agentId);
    if (success) {
      refetch();
    }
  };

  const handleCreateTestAgent = async () => {
    const success = await createTestAgent();
    if (success) {
      refetch();
    }
  };

  const handleConfigureAgent = (agent: Agent) => {
    console.log('Configuring agent:', agent);
    setSelectedAgent(agent);
    setShowConfigForm(true);
  };

  console.log('Current agents state:', { agents, isLoading, error });

  if (isLoading) {
    return <AgentsLoadingState />;
  }

  if (error) {
    return <AgentsErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateTestAgent}>
            <Plus className="w-4 h-4 mr-2" />
            Create Test Agent
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      <AgentsDebugInfo agents={agents} isLoading={isLoading} error={error} />

      <div className="grid gap-4">
        {agents?.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onConfigure={handleConfigureAgent}
            onDelete={handleDeleteAgent}
          />
        ))}
      </div>

      {(!agents || agents.length === 0) && (
        <AgentsEmptyState
          onRefresh={() => refetch()}
          onCreateTestAgent={handleCreateTestAgent}
        />
      )}

      {showConfigForm && (
        <AgentConfigForm
          agent={selectedAgent}
          onClose={() => {
            setShowConfigForm(false);
            setSelectedAgent(null);
          }}
        />
      )}
    </div>
  );
}
