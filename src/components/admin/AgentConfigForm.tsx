import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Agent, AgentConfigVersion, ModelCatalog } from '@/types/database';
import { Separator } from '@/components/ui/separator';
import KnowledgeBaseUpload from './KnowledgeBaseUpload';
import KnowledgeBaseDocuments from './KnowledgeBaseDocuments';

interface AgentConfigFormProps {
  agent: Agent | null;
  onClose: () => void;
}

export default function AgentConfigForm({ agent, onClose }: AgentConfigFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch current agent configuration
  const { data: currentConfig } = useQuery({
    queryKey: ['agent-config', agent.agent_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_config_versions')
        .select('*')
        .eq('agent_id', agent.agent_id)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching config:', error);
      }
      return data as AgentConfigVersion | null;
    }
  });

  // Fetch available models with better error handling and debugging
  const { data: models = [], isLoading: modelsLoading, error: modelsError } = useQuery({
    queryKey: ['models-for-config'],
    queryFn: async () => {
      console.log('Fetching models for agent configuration...');
      const { data, error } = await supabase
        .from('model_catalog')
        .select('*')
        .eq('enabled', true)
        .order('provider', { ascending: true })
        .order('model_name', { ascending: true });
      
      console.log('Models query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error('Error fetching models for config:', error);
        throw error;
      }
      
      return data as ModelCatalog[];
    }
  });

  // Log models data for debugging
  console.log('Available models in config:', models);
  console.log('Models loading state:', modelsLoading);
  console.log('Models error:', modelsError);

  const [config, setConfig] = useState(() => {
    const defaultConfig = {
      model: {
        text: { provider: 'openai', model: 'gpt-4o-mini' },
        image: { provider: 'openai', model: 'dall-e-3' },
        audio: { provider: null, model: null },
        video: { provider: null, model: null }
      },
      generation: {
        max_context_tokens: 8000,
        max_response_tokens: 4000,
        temperature: 0.7,
        top_p: 1
      },
      prompt: '',
      tools: [],
      knowledge_base: {
        enabled: false,
        vector_store_id: null,
        chunk_size: 300,
        chunk_overlap: 50,
        retrieval_depth: 5,
        keyword_extraction: 'tfidf'
      },
      agent_as_tool: {
        expose: false,
        function_name: '',
        signature: {}
      },
      router: {
        strategy: 'manual',
        default_child: null
      }
    };

    return currentConfig?.settings || defaultConfig;
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig: any) => {
      const nextVersion = (currentConfig?.version || 0) + 1;
      
      // Deactivate current version if exists
      if (currentConfig) {
        await supabase
          .from('agent_config_versions')
          .update({ is_active: false })
          .eq('agent_id', agent.agent_id)
          .eq('is_active', true);
      }

      // Insert new version
      const { error } = await supabase
        .from('agent_config_versions')
        .insert({
          agent_id: agent.agent_id,
          version: nextVersion,
          is_active: true,
          settings: newConfig
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Configuration saved',
        description: 'Agent configuration has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['agent-config', agent.agent_id] });
      onClose();
    },
    onError: (error) => {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSave = () => {
    saveConfigMutation.mutate(config);
  };

  const getModelsByModality = (modality: string) => {
    console.log(`Getting models for modality: ${modality}`, models?.filter(model => model.modality === modality));
    return models.filter(model => model.modality === modality);
  };

  // Show error state if models failed to load
  if (modelsError) {
    console.error('Models loading error:', modelsError);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Configure Agent: {agent.label}</CardTitle>
          {modelsError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Error loading models: {modelsError.message}
            </div>
          )}
          {modelsLoading && (
            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              Loading available models...
            </div>
          )}
          <div className="text-sm text-gray-600">
            Available models: {models.length} ({models.filter(m => m.modality === 'text').length} text, {models.filter(m => m.modality === 'image').length} image)
          </div>
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

            <TabsContent value="models" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="text-model">Text Model</Label>
                  <Select
                    value={config.model.text.model}
                    onValueChange={(value) => {
                      const selectedModel = models.find(m => m.model_name === value && m.modality === 'text');
                      console.log('Selected text model:', selectedModel);
                      setConfig(prev => ({
                        ...prev,
                        model: {
                          ...prev.model,
                          text: {
                            provider: selectedModel?.provider || 'openai',
                            model: value
                          }
                        }
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select text model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelsByModality('text').map((model) => (
                        <SelectItem key={model.id} value={model.model_name}>
                          {model.provider} - {model.model_name}
                        </SelectItem>
                      ))}
                      {getModelsByModality('text').length === 0 && (
                        <SelectItem value="no-models" disabled>
                          No text models available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getModelsByModality('text').length} text models available
                  </p>
                </div>

                <div>
                  <Label htmlFor="image-model">Image Model</Label>
                  <Select
                    value={config.model.image.model}
                    onValueChange={(value) => {
                      const selectedModel = models.find(m => m.model_name === value && m.modality === 'image');
                      console.log('Selected image model:', selectedModel);
                      setConfig(prev => ({
                        ...prev,
                        model: {
                          ...prev.model,
                          image: {
                            provider: selectedModel?.provider || 'openai',
                            model: value
                          }
                        }
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select image model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelsByModality('image').map((model) => (
                        <SelectItem key={model.id} value={model.model_name}>
                          {model.provider} - {model.model_name}
                        </SelectItem>
                      ))}
                      {getModelsByModality('image').length === 0 && (
                        <SelectItem value="no-models" disabled>
                          No image models available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getModelsByModality('image').length} image models available
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-context">Max Context Tokens</Label>
                  <Input
                    id="max-context"
                    type="number"
                    value={config.generation.max_context_tokens}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      generation: {
                        ...prev.generation,
                        max_context_tokens: parseInt(e.target.value) || 8000
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="max-response">Max Response Tokens</Label>
                  <Input
                    id="max-response"
                    type="number"
                    value={config.generation.max_response_tokens}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      generation: {
                        ...prev.generation,
                        max_response_tokens: parseInt(e.target.value) || 4000
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={config.generation.temperature}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      generation: {
                        ...prev.generation,
                        temperature: parseFloat(e.target.value) || 0.7
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="top-p">Top P</Label>
                  <Input
                    id="top-p"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={config.generation.top_p}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      generation: {
                        ...prev.generation,
                        top_p: parseFloat(e.target.value) || 1
                      }
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="space-y-4">
              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  placeholder="Enter the system prompt for this agent..."
                  value={config.prompt}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    prompt: e.target.value
                  }))}
                  rows={10}
                />
              </div>
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="grid gap-6">
                <KnowledgeBaseUpload agentId={agent.agent_id} />
                <KnowledgeBaseDocuments agentId={agent.agent_id} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveConfigMutation.isPending}>
              {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
