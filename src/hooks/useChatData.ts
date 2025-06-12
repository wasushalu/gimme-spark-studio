
import { useState } from "react";
import { agents, Agent } from "@/components/agents/AgentSelector";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useChatData() {
  const [activeAgent, setActiveAgent] = useState<string>('gimmebot');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentAgent = agents.find(agent => agent.id === activeAgent) || agents[0];

  const handleAgentSelect = (agentId: string) => {
    setActiveAgent(agentId);
    setMessages([]); // Clear messages when switching agents
  };

  const handleSendMessage = (message: string) => {
    setIsLoading(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Thank you for your message! I'm ${currentAgent.name} and I'll help you with that.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  return {
    activeAgent,
    messages,
    isLoading,
    currentAgent,
    handleAgentSelect,
    handleSendMessage,
  };
}

export type { Message };
