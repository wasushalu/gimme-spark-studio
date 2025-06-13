
import { useState, useEffect } from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface AgentConversationHistoryProps {
  agentType: string;
}

// Mock conversation data - in a real app this would come from a database or API
const mockConversations: Record<string, Conversation[]> = {
  gimmebot: [
    {
      id: '1',
      title: 'Marketing Strategy Discussion',
      lastMessage: 'That sounds like a great approach for your campaign.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      messageCount: 8
    },
    {
      id: '2', 
      title: 'Content Ideas for Social Media',
      lastMessage: 'Here are some engaging post ideas for your brand.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      messageCount: 12
    },
    {
      id: '3',
      title: 'Brand Voice Guidelines',
      lastMessage: 'Your brand voice should be friendly yet professional.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      messageCount: 15
    }
  ],
  studio: [
    {
      id: '4',
      title: 'Creative Campaign Concepts',
      lastMessage: 'I love the visual direction we explored.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      messageCount: 6
    },
    {
      id: '5',
      title: 'Logo Design Feedback',
      lastMessage: 'The color palette works perfectly with your brand.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      messageCount: 9
    }
  ],
  neutral_chat: [
    {
      id: '6',
      title: 'General Questions',
      lastMessage: 'I hope that helps clarify things for you.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      messageCount: 4
    },
    {
      id: '7',
      title: 'Technical Support',
      lastMessage: 'Try restarting the application and let me know.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      messageCount: 7
    }
  ]
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export function AgentConversationHistory({ agentType }: AgentConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Load conversations for the selected agent
    const agentConversations = mockConversations[agentType] || [];
    setConversations(agentConversations);
  }, [agentType]);

  const handleConversationClick = (conversation: Conversation) => {
    console.log('Load conversation:', conversation.id, 'for agent:', agentType);
    // Here you would implement the logic to load the conversation
    // This could involve updating the current conversation state in your chat hooks
  };

  if (conversations.length === 0) {
    return (
      <div className="px-2 py-4 text-center">
        <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start chatting with {agentType} to see history here
        </p>
      </div>
    );
  }

  return (
    <SidebarMenu>
      {conversations.map((conversation) => (
        <SidebarMenuItem key={conversation.id}>
          <SidebarMenuButton 
            onClick={() => handleConversationClick(conversation)}
            className="flex-col items-start p-3 h-auto hover:bg-sidebar-accent"
          >
            <div className="w-full flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate mb-1">
                  {conversation.title}
                </p>
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {conversation.lastMessage}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(conversation.timestamp)}</span>
                  <span>•</span>
                  <span>{conversation.messageCount} messages</span>
                </div>
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
