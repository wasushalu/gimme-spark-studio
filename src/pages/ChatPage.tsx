
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, Lightbulb, MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Agent {
  id: string;
  name: string;
  icon: typeof Bot;
  welcomeMessage: string;
}

const agents: Agent[] = [
  {
    id: 'gimmebot',
    name: 'gimmebot',
    icon: Bot,
    welcomeMessage: 'Hello! I\'m gimmebot, your AI marketing assistant. How can I help you create amazing marketing content today?'
  },
  {
    id: 'creative_concept',
    name: 'Creative Concept',
    icon: Lightbulb,
    welcomeMessage: 'Hi there! I\'m here to help you brainstorm creative concepts and ideas. What are you working on?'
  },
  {
    id: 'neutral_chat',
    name: 'General Chat',
    icon: MessageCircle,
    welcomeMessage: 'Hello! I\'m here for open conversation. What would you like to chat about?'
  }
];

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agent') || 'gimmebot';
  const currentAgent = agents.find(a => a.id === agentId) || agents[0];
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: currentAgent.welcomeMessage,
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  // Update welcome message when agent changes
  useEffect(() => {
    setMessages([{
      id: '1',
      content: currentAgent.welcomeMessage,
      role: 'assistant',
      timestamp: new Date()
    }]);
  }, [currentAgent.welcomeMessage]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Thank you for your message. I'm ${currentAgent.name} and I'll help you with that.`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const IconComponent = currentAgent.icon;

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <IconComponent className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-medium">{currentAgent.name}</h1>
            <p className="text-xs text-muted-foreground">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-12'
                  : 'bg-muted mr-12'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/40 p-4">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${currentAgent.name}...`}
              className="pr-12 py-3 text-sm rounded-xl border-input/50 focus:border-primary/50 resize-none"
              style={{ minHeight: '44px' }}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
