
import { useState } from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Book, 
  User, 
  Plus,
  History,
  ChevronDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AgentConversationHistory } from '@/components/sidebar/AgentConversationHistory';

const mainItems = [
  {
    title: 'gimmebot',
    url: '/gimmebot',
    icon: MessageCircle,
    description: 'Public marketing assistant',
    gradient: 'from-marketing-500 to-marketing-600'
  },
  {
    title: 'Studio',
    url: '/studio',
    icon: Book,
    description: 'Creative concept agent',
    gradient: 'from-creative-500 to-creative-600'
  },
  {
    title: 'Chat',
    url: '/chat',
    icon: MessageCircle,
    description: 'General purpose assistant',
    gradient: 'from-gray-500 to-gray-600'
  }
];

const workspaceItems = [
  {
    title: 'Brand Vault',
    url: '/vault',
    icon: Book
  },
  {
    title: 'Profile',
    url: '/profile',
    icon: User
  }
];

const agentOptions = [
  { value: 'gimmebot', label: 'gimmebot' },
  { value: 'studio', label: 'Studio' },
  { value: 'neutral_chat', label: 'Chat' }
];

export function AppSidebar() {
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedAgent, setSelectedAgent] = useState<string>('gimmebot');

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm">Gimmefy</h2>
            <p className="text-xs text-muted-foreground">AI Marketing Studio</p>
          </div>
        </div>
        
        <Button size="sm" className="w-full justify-start gap-2">
          <Plus className="w-4 h-4" />
          New Workspace
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>AI Agents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentPath === item.url}
                    className="group"
                  >
                    <a 
                      href={item.url}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPath(item.url);
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-sidebar-accent"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 mb-3">
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agentOptions.map((agent) => (
                    <SelectItem key={agent.value} value={agent.value}>
                      {agent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AgentConversationHistory agentType={selectedAgent} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentPath === item.url}
                  >
                    <a 
                      href={item.url}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPath(item.url);
                      }}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Demo User</p>
            <p className="text-xs text-muted-foreground truncate">Free Plan</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
