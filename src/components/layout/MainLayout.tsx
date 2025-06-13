
import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AgentConversationHistory } from '@/components/sidebar/AgentConversationHistory';
import { History } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const agentOptions = [
  { value: 'gimmebot', label: 'gimmebot' },
  { value: 'studio', label: 'Studio' },
  { value: 'neutral_chat', label: 'Chat' }
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('gimmebot');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center gap-4 p-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <h1 className="text-xl font-semibold gradient-text">Gimmefy</h1>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <History className="w-6 h-6" />
                  <h2 className="text-2xl font-semibold">Conversation History</h2>
                </div>
                <div className="max-w-xs">
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md">
                      {agentOptions.map((agent) => (
                        <SelectItem key={agent.value} value={agent.value}>
                          {agent.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <AgentConversationHistory agentType={selectedAgent} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
