
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tool {
  id: string;
  name: string;
  description: string | null;
  function_schema: any;
  enabled: boolean;
  created_at: string;
}

export default function ToolsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tools, isLoading, refetch } = useQuery({
    queryKey: ['admin-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_registry')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Tool[];
    }
  });

  const toggleToolStatus = async (toolId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tool_registry')
        .update({ enabled: !currentStatus })
        .eq('id', toolId);

      if (error) throw error;

      toast({
        title: 'Tool updated',
        description: `Tool has been ${!currentStatus ? 'enabled' : 'disabled'}.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tool status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredTools = tools?.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tool Registry</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Tool
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTools?.map((tool) => (
          <Card key={tool.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{tool.name}</CardTitle>
              <Badge variant={tool.enabled ? 'default' : 'secondary'}>
                {tool.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {tool.description || 'No description available'}
                </p>
                <p className="text-sm text-gray-500">
                  Added: {new Date(tool.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Function schema configured
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleToolStatus(tool.id, tool.enabled)}
                  >
                    {tool.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!filteredTools || filteredTools.length === 0) && (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No tools match your search' : 'No tools found'}
          </div>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first tool.'}
          </p>
          {!searchTerm && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Tool
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
