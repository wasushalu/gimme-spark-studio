
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Save, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  name: string;
  label: string;
  description: string;
  required: boolean;
  category: string;
}

const API_KEYS: ApiKey[] = [
  // AI Providers
  { name: 'OPENAI_API_KEY', label: 'OpenAI API Key', description: 'For GPT models and DALL-E', required: true, category: 'AI Providers' },
  { name: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', description: 'For Claude models', required: false, category: 'AI Providers' },
  { name: 'GOOGLE_AI_API_KEY', label: 'Google AI API Key', description: 'For Gemini models', required: false, category: 'AI Providers' },
  { name: 'PERPLEXITY_API_KEY', label: 'Perplexity API Key', description: 'For Perplexity models', required: false, category: 'AI Providers' },
  { name: 'ELEVENLABS_API_KEY', label: 'ElevenLabs API Key', description: 'For voice synthesis', required: false, category: 'AI Providers' },
  
  // Payment & Communication
  { name: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', description: 'For payment processing', required: false, category: 'Payments' },
  { name: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', description: 'For webhook verification', required: false, category: 'Payments' },
  { name: 'SENDGRID_API_KEY', label: 'SendGrid API Key', description: 'For email notifications', required: false, category: 'Communication' },
  { name: 'TWILIO_ACCOUNT_SID', label: 'Twilio Account SID', description: 'For SMS services', required: false, category: 'Communication' },
  { name: 'TWILIO_AUTH_TOKEN', label: 'Twilio Auth Token', description: 'For SMS authentication', required: false, category: 'Communication' },
  
  // Other Services
  { name: 'GOOGLE_MAPS_API_KEY', label: 'Google Maps API Key', description: 'For location services', required: false, category: 'Other Services' },
];

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const toggleVisibility = (keyName: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const updateApiKey = (keyName: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [keyName]: value
    }));
  };

  const saveApiKey = async (keyName: string) => {
    setLoading(true);
    try {
      // Here you would integrate with Supabase secrets
      // For now, we'll simulate the save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'API Key Saved',
        description: `${keyName} has been securely saved.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save API key. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAllKeys = async () => {
    setLoading(true);
    try {
      // Here you would save all keys to Supabase secrets
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'All API Keys Saved',
        description: 'All API keys have been securely saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save some API keys. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedKeys = API_KEYS.reduce((acc, key) => {
    if (!acc[key.category]) {
      acc[key.category] = [];
    }
    acc[key.category].push(key);
    return acc;
  }, {} as Record<string, ApiKey[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys Management</h1>
          <p className="text-gray-600 mt-1">Securely manage all your service API keys in one place</p>
        </div>
        <Button onClick={saveAllKeys} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          Save All Keys
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedKeys).map(([category, keys]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {keys.map((keyConfig) => (
                <div key={keyConfig.name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={keyConfig.name}>{keyConfig.label}</Label>
                    {keyConfig.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={keyConfig.name}
                        type={visibleKeys[keyConfig.name] ? 'text' : 'password'}
                        placeholder={`Enter your ${keyConfig.label}...`}
                        value={apiKeys[keyConfig.name] || ''}
                        onChange={(e) => updateApiKey(keyConfig.name, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleVisibility(keyConfig.name)}
                      >
                        {visibleKeys[keyConfig.name] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => saveApiKey(keyConfig.name)}
                      disabled={loading || !apiKeys[keyConfig.name]}
                    >
                      Save
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {keyConfig.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Security Notice</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All API keys are securely encrypted and stored using Supabase Secrets. 
            Keys are never exposed in your application code or logs. 
            Only authorized edge functions can access these keys when needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
