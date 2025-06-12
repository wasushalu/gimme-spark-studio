
import { useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export function GimmebotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `Thanks for your message! I'm gimmebot, your friendly marketing assistant. I can help you with:\n\n• Marketing strategy advice\n• Content ideas and brainstorming\n• Campaign concepts\n• Brand positioning\n• Social media tips\n\nWhat marketing challenge can I help you tackle today?`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-6">
      {/* Welcome Panel */}
      <div className="lg:w-80 space-y-4">
        <Card className="p-6 notion-shadow-lg">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-marketing-500 to-marketing-600 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">gimmebot</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Your free marketing assistant
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 notion-shadow">
          <h3 className="font-semibold mb-2">Try asking about:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Content marketing strategies</li>
            <li>• Social media best practices</li>
            <li>• Brand positioning</li>
            <li>• Campaign ideas</li>
            <li>• Marketing trends</li>
          </ul>
        </Card>

        <Card className="p-4 notion-shadow bg-gradient-to-br from-primary/5 to-creative/5">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-sm">Want more power?</h3>
            <p className="text-xs text-muted-foreground">
              Unlock Studio and premium features with an account
            </p>
            <button className="w-full mt-2 px-3 py-2 bg-primary text-primary-foreground text-xs rounded-lg hover:bg-primary/90 transition-colors">
              Sign Up Free
            </button>
          </div>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="flex-1">
        <Card className="h-full notion-shadow-lg">
          <ChatInterface
            agentName="gimmebot"
            agentDescription="Free marketing assistant - no login required"
            agentIcon={MessageCircle}
            placeholder="Ask me anything about marketing..."
            welcomeMessage="Hi there! 👋 I'm gimmebot, your friendly marketing assistant. I'm here to help with any marketing questions or challenges you have. What would you like to explore today?"
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        </Card>
      </div>
    </div>
  );
}
