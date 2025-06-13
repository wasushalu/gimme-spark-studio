
import { useState, useEffect } from 'react';
import { MessageCircle, Clock } from 'lucide-react';

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
    console.log('AgentConversationHistory: Loading conversations for agent:', agentType, 'Count:', agentConversations.length);
  }, [agentType]);

  const handleConversationClick = (conversation: Conversation) => {
    console.log('Load conversation:', conversation.id, 'for agent:', agentType);
    // Here you would implement the logic to load the conversation
    // This could involve updating the current conversation state in your chat hooks
  };

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
        <p className="text-muted-foreground">
          Start chatting with {agentType} to see history here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => handleConversationClick(conversation)}
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-lg truncate flex-1 mr-4">
              {conversation.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(conversation.timestamp)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {conversation.lastMessage}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {conversation.messageCount} messages
            </span>
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
}
