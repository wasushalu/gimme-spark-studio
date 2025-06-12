
import { useState } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { AuthModal } from '@/components/auth/AuthModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { toast } from 'sonner';

export function GimmebotPage() {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const {
    agentConfig,
    messages,
    messagesLoading,
    sendMessage,
    isLoading,
    startNewConversation,
  } = useChat('gimmebot');

  const handleSendMessage = (content: string) => {
    sendMessage({ content });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      startNewConversation(); // Clear current conversation
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // Convert database messages to ChatInterface format
  const interfaceMessages = messages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.created_at),
  }));

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

        {user ? (
          <Card className="p-4 notion-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : profile?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={startNewConversation}
                className="flex-1"
              >
                New Chat
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-4 notion-shadow">
            <h3 className="font-semibold mb-2">Sign in for more features</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Save your conversations and access Studio features
            </p>
            <Button 
              onClick={() => setShowAuthModal(true)}
              size="sm" 
              className="w-full"
            >
              Sign In / Sign Up
            </Button>
          </Card>
        )}

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

        {!user && (
          <Card className="p-4 notion-shadow bg-gradient-to-br from-primary/5 to-creative/5">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-sm">Want more power?</h3>
              <p className="text-xs text-muted-foreground">
                Unlock Studio and premium features with an account
              </p>
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="w-full mt-2 px-3 py-2 text-xs"
                size="sm"
              >
                Sign Up Free
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1">
        <Card className="h-full notion-shadow-lg">
          <ChatInterface
            agentName={agentConfig?.name || "gimmebot"}
            agentDescription={agentConfig?.description || "Free marketing assistant - no login required"}
            agentIcon={MessageCircle}
            placeholder="Ask me anything about marketing..."
            welcomeMessage="Hi there! 👋 I'm gimmebot, your friendly marketing assistant. I'm here to help with any marketing questions or challenges you have. What would you like to explore today?"
            messages={interfaceMessages}
            isLoading={isLoading || messagesLoading}
            onSendMessage={handleSendMessage}
          />
        </Card>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}
