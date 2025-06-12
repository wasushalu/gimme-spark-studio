
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Copy, Eye, Settings } from 'lucide-react';

interface Agent {
  id: string;
  agent_id: string;
  label: string;
  type: 'root' | 'sub' | 'utility';
  visibility: 'public' | 'workspace' | 'internal';
  created_at: string;
}

interface AgentCardProps {
  agent: Agent;
  onConfigure: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'root': return 'bg-blue-100 text-blue-800';
    case 'sub': return 'bg-green-100 text-green-800';
    case 'utility': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getVisibilityColor = (visibility: string) => {
  switch (visibility) {
    case 'public': return 'bg-emerald-100 text-emerald-800';
    case 'workspace': return 'bg-orange-100 text-orange-800';
    case 'internal': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function AgentCard({ agent, onConfigure, onDelete }: AgentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{agent.label}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge className={getTypeColor(agent.type)}>
            {agent.type}
          </Badge>
          <Badge className={getVisibilityColor(agent.visibility)}>
            {agent.visibility}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Agent ID: <code className="bg-gray-100 px-1 rounded">{agent.agent_id}</code>
            </p>
            <p className="text-sm text-gray-500">
              Created: {new Date(agent.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onConfigure(agent)}
            >
              <Settings className="w-4 h-4 mr-1" />
              Configure
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-1" />
              Clone
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(agent.agent_id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
