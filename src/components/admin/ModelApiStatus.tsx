
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ModelApiStatusProps {
  provider: string;
  modelName: string;
}

const getApiStatus = (provider: string, modelName: string) => {
  // Define which models have publicly accessible APIs
  const apiAvailable: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'dall-e-3', 'dall-e-2', 'whisper-1', 'tts-1', 'tts-1-hd'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-opus-4-20250514', 'claude-sonnet-4-20250514'],
    google: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    perplexity: ['llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-huge-128k-online'],
    elevenlabs: ['eleven_multilingual_v2', 'eleven_turbo_v2_5', 'eleven_turbo_v2', 'eleven_multilingual_v1', 'eleven_multilingual_sts_v2', 'eleven_monolingual_v1', 'eleven_english_sts_v2'],
    mistral: ['mistral-large'],
    cohere: ['command-r-plus']
  };

  const providerModels = apiAvailable[provider.toLowerCase()] || [];
  
  if (providerModels.includes(modelName)) {
    return { status: 'available', icon: CheckCircle, color: 'bg-green-100 text-green-800' };
  }
  
  // Check for models with limited access
  const limitedAccess = ['sora', 'gen-3-alpha', 'imagen-video', 'imagen-2'];
  if (limitedAccess.includes(modelName)) {
    return { status: 'limited', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800' };
  }
  
  return { status: 'unavailable', icon: XCircle, color: 'bg-red-100 text-red-800' };
};

export default function ModelApiStatus({ provider, modelName }: ModelApiStatusProps) {
  const { status, icon: Icon, color } = getApiStatus(provider, modelName);
  
  const statusText = {
    available: 'API Available',
    limited: 'Limited Access',
    unavailable: 'No Public API'
  };

  return (
    <Badge className={`${color} text-xs`}>
      <Icon className="w-3 h-3 mr-1" />
      {statusText[status]}
    </Badge>
  );
}
