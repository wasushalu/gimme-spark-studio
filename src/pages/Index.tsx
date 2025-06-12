
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { GimmebotPage } from '@/pages/GimmebotPage';
import { AuthModal } from '@/components/auth/AuthModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Book, 
  User, 
  Sparkles,
  ArrowUp,
  Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: MessageCircle,
    title: 'gimmebot',
    description: 'Free marketing assistant available to everyone',
    gradient: 'from-marketing-500 to-marketing-600',
    available: true
  },
  {
    icon: Book,
    title: 'Studio',
    description: 'Creative concept agent with brand context',
    gradient: 'from-creative-500 to-creative-600',
    available: false
  },
  {
    icon: User,
    title: 'Neutral Chat',
    description: 'General purpose AI assistant',
    gradient: 'from-gray-500 to-gray-600',
    available: false
  }
];

export default function Index() {
  const [currentView, setCurrentView] = useState<'home' | 'gimmebot'>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  if (currentView === 'gimmebot') {
    return (
      <MainLayout>
        <GimmebotPage />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold">
              Meet Your AI
              <span className="block gradient-text">Marketing Team</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Three specialized AI agents to supercharge your marketing workflow. 
              From brainstorming to execution, we've got you covered.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="gradient-brand text-white px-8 py-3 h-auto"
              onClick={() => setCurrentView('gimmebot')}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Try gimmebot Free
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-3 h-auto">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className={`p-6 notion-shadow-lg transition-all duration-300 hover:scale-105 ${
                feature.available ? 'cursor-pointer hover:notion-shadow-xl' : 'opacity-75'
              }`}
              onClick={() => feature.available && feature.title === 'gimmebot' && setCurrentView('gimmebot')}
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    {feature.available ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {feature.available && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-center"
                  >
                    Try Now
                    <ArrowUp className="w-4 h-4 ml-2 rotate-45" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Value Proposition */}
        <Card className="p-8 notion-shadow-lg bg-gradient-to-br from-background to-muted/20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-creative-500 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold">Why Gimmefy?</h2>
            
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <h3 className="font-semibold">Specialized Agents</h3>
                <p className="text-sm text-muted-foreground">
                  Each AI is trained for specific marketing tasks, not generic responses
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Brand Context</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your brand assets and get on-brand suggestions every time
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Export Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Get formatted outputs you can use immediately in presentations
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="p-8 notion-shadow-lg gradient-brand text-white text-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ready to get started?</h2>
            <p className="opacity-90">
              Try gimmebot for free right now, or sign up to unlock the full suite
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="px-8 py-3 h-auto"
                onClick={() => setCurrentView('gimmebot')}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Start with gimmebot
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-3 h-auto border-white/20 text-white hover:bg-white/10"
                onClick={() => user ? setCurrentView('gimmebot') : setShowAuthModal(true)}
              >
                {user ? 'Go to Dashboard' : 'Sign Up Free'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </MainLayout>
  );
}
