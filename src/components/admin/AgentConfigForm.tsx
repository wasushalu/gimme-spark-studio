
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Agent } from '@/types/database';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import ModelsTab from './config/ModelsTab';
import ParametersTab from './config/ParametersTab';
import PromptTab from './config/PromptTab';
import KnowledgeBaseTab from './config/KnowledgeBaseTab';
import DocumentsTab from './config/DocumentsTab';

interface AgentConfigFormProps {
  agent: Agent | null;
  onClose: () => void;
}

export default function AgentConfigForm({ agent, onClose }: AgentConfigFormProps) {
  const {
    config,
    setConfig,
    models,
    modelsLoading,
    modelsError,
    saveConfigMutation,
    getModelsByModality
  } = useAgentConfig(agent);

  console.log('AgentConfigForm: Rendering with:', {
    agentId: agent?.agent_id,
    modelsCount: models.length,
    configExists: !!config,
    modelsLoading,
    modelsError: modelsError?.message
  });

  // Early return if no agent is provided
  if (!agent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">No agent selected for configuration.</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    console.log('AgentConfigForm: Saving config:', config);
    saveConfigMutation.mutate(config);
  };

  // Handle save success
  if (saveConfigMutation.isSuccess) {
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Configure Agent: {agent.label}</CardTitle>
          
          {/* Status indicators */}
          {modelsLoading && (
            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              Loading available models...
            </div>
          )}
          
          {modelsError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Error loading models: {modelsError.message}
            </div>
          )}
          
          {!modelsLoading && !modelsError && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              Loaded {models.length} models ({models.filter(m => m.modality === 'text').length} text, {models.filter(m => m.modality === 'image').length} image)
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="models" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="prompt">System Prompt</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="models">
              <ModelsTab
                config={config}
                setConfig={setConfig}
                models={models}
                getModelsByModality={getModelsByModality}
              />
            </TabsContent>

            <TabsContent value="parameters">
              <ParametersTab config={config} setConfig={setConfig} />
            </TabsContent>

            <TabsContent value="prompt">
              <PromptTab config={config} setConfig={setConfig} />
            </TabsContent>

            <TabsContent value="knowledge">
              <KnowledgeBaseTab config={config} setConfig={setConfig} />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsTab agentId={agent.agent_id} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveConfigMutation.isPending || modelsLoading}
            >
              {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
