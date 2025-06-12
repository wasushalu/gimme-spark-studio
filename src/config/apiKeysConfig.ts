export interface ApiKey {
  name: string;
  label: string;
  description: string;
  required: boolean;
  category: string;
}

export const API_KEYS: ApiKey[] = [
  // AI Providers
  { name: 'OPENAI_API_KEY', label: 'OpenAI API Key', description: 'For GPT models and DALL-E', required: true, category: 'AI Providers' },
  { name: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', description: 'For Claude models', required: false, category: 'AI Providers' },
  { name: 'GOOGLE_AI_API_KEY', label: 'Google AI API Key', description: 'For Gemini models', required: false, category: 'AI Providers' },
  { name: 'PERPLEXITY_API_KEY', label: 'Perplexity API Key', description: 'For Perplexity models', required: false, category: 'AI Providers' },
  { name: 'MISTRAL_API_KEY', label: 'Mistral API Key', description: 'For Mistral models', required: false, category: 'AI Providers' },
  { name: 'COHERE_API_KEY', label: 'Cohere API Key', description: 'For Cohere models', required: false, category: 'AI Providers' },
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
