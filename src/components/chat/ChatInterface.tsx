
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MessageCircle, User, Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatInterfaceProps {
  agentName: string;
  agentDescription: string;
  agentIcon?: React.ComponentType<{ className?: string }>;
  placeholder?: string;
  welcomeMessage?: string;
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
  messages: Message[];
}

const loadingMessages = [
  "Cooking up a genius idea...",
  "Mixing creativity potions...",
  "Consulting the marketing gods...",
  "Brewing the perfect campaign...",
  "Channeling creative energy...",
  "Crafting marketing magic...",
  "Summoning brilliant concepts...",
  "Weaving words of wisdom..."
];

export function ChatInterface({
  agentName,
  agentDescription,
  agentIcon: AgentIcon = MessageCircle,
  placeholder = "Type your message...",
  welcomeMessage,
  isLoading = false,
  onSendMessage,
  messages
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  // Rotate loading messages
  React.useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <AgentIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{agentName}</h2>
            <p className="text-sm text-muted-foreground">{agentDescription}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {welcomeMessage && messages.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                <AgentIcon className="w-4 h-4 text-white" />
              </div>
              <Card className="p-4 max-w-[85%] notion-shadow">
                <p className="text-sm leading-relaxed">{welcomeMessage}</p>
              </Card>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-muted' 
                  : 'bg-gradient-to-br from-primary to-primary/80'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <AgentIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <Card className={`p-4 max-w-[85%] notion-shadow ${
                message.role === 'user' ? 'bg-primary text-primary-foreground' : ''
              }`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.isLoading ? (
                    <span className="loading-dots">{loadingMessages[loadingMessageIndex]}</span>
                  ) : (
                    message.content
                  )}
                </div>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 animate-pulse-slow">
                <AgentIcon className="w-4 h-4 text-white" />
              </div>
              <Card className="p-4 max-w-[85%] notion-shadow">
                <div className="text-sm text-muted-foreground animate-pulse">
                  <span className="loading-dots">{loadingMessages[loadingMessageIndex]}</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            size="sm"
            className="h-[44px] px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
