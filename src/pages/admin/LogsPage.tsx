
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Filter, RefreshCw } from 'lucide-react';

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Placeholder data for logs - in a real app, this would come from your logging system
  const mockLogs = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'chat-api',
      message: 'User started new conversation with gimmebot',
      userId: 'user-123',
      agentId: 'gimmebot'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'error',
      source: 'knowledge-base',
      message: 'Failed to retrieve document embeddings',
      userId: 'user-456',
      agentId: 'creative_concept'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'warn',
      source: 'rate-limiter',
      message: 'User approaching rate limit',
      userId: 'user-789',
      agentId: 'neutral_chat'
    },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = mockLogs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <Badge className={getLevelColor(log.level)}>
                  {log.level.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-500">{log.source}</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900 mb-2">{log.message}</p>
              <div className="flex space-x-4 text-xs text-gray-500">
                <span>User: {log.userId}</span>
                <span>Agent: {log.agentId}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No logs match your search' : 'No logs available'}
          </div>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Logs will appear here as the system generates them.'}
          </p>
        </div>
      )}
    </div>
  );
}
