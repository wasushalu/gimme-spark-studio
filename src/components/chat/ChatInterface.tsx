
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, Send, Sparkles } from 'lucide-react';

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
  "Thinking...",
  "Processing your request...",
  "Generating response...",
  "Almost ready...",
  "Crafting the perfect answer...",
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
    <div className="flex flex-col h-full">
      {/* Enhanced Header */}
      <div className="border-b bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <AgentIcon className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-xl">{agentName}</h2>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{agentDescription}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {welcomeMessage && messages.length === 0 && (
            <div className="flex items-start gap-4 animate-in">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-md">
                <AgentIcon className="w-5 h-5 text-white" />
              </div>
              <Card className="p-6 max-w-[85%] notion-shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <span className="text-sm font-medium text-primary">Welcome Message</span>
                </div>
                <p className="text-sm leading-relaxed">{welcomeMessage}</p>
              </Card>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-4 animate-in ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-muted to-muted/60' 
                  : 'bg-gradient-to-br from-primary to-primary/80'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <AgentIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <Card className={`p-6 max-w-[85%] notion-shadow-lg border-0 ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground' 
                  : 'bg-gradient-to-br from-card to-card/80'
              }`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.isLoading ? (
                    <span className="loading-dots flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="ml-2">{loadingMessages[loadingMessageIndex]}</span>
                    </span>
                  ) : (
                    message.content
                  )}
                </div>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-4 animate-in">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 animate-pulse-slow shadow-md">
                <AgentIcon className="w-5 h-5 text-white" />
              </div>
              <Card className="p-6 max-w-[85%] notion-shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
                <div className="text-sm text-muted-foreground">
                  <span className="loading-dots flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="ml-2">{loadingMessages[loadingMessageIndex]}</span>
                  </span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Enhanced Input */}
      <div className="border-t bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm p-6">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading}
              className="min-h-[52px] max-h-32 resize-none pr-12 border-0 bg-background/60 backdrop-blur-sm focus:bg-background/80 transition-all duration-200"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg shadow-md"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
