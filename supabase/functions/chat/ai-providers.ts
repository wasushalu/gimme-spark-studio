
import { getApiKey } from './config.ts';

export async function callOpenAI(model: string, messages: any[], config: any, apiKey: string) {
  console.log('=== OPENAI CALL START ===');
  console.log('OpenAI API Key status:', {
    hasKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyPrefix: apiKey ? apiKey.substring(0, 7) + '...' : 'none'
  });

  if (!apiKey) {
    console.error('OpenAI API key not provided to callOpenAI function');
    throw new Error('OpenAI API key not provided');
  }

  // Use ALL parameters from database configuration - NO DEFAULTS
  const systemPrompt = config.prompt;
  const temperature = config.generation?.temperature;
  const maxTokens = config.generation?.max_response_tokens;

  if (systemPrompt === undefined || temperature === undefined || maxTokens === undefined) {
    console.error('Missing required configuration parameters:', {
      hasPrompt: systemPrompt !== undefined,
      hasTemperature: temperature !== undefined,
      hasMaxTokens: maxTokens !== undefined
    });
    throw new Error('Missing required configuration parameters. Please configure the agent completely in the admin panel.');
  }

  console.log('OpenAI call parameters from database config:', {
    model,
    systemPromptLength: systemPrompt.length,
    messagesCount: messages.length,
    temperature,
    maxTokens
  });

  const requestBody = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: temperature,
    max_tokens: maxTokens,
  };

  console.log('OpenAI request body structure:', {
    model: requestBody.model,
    messagesCount: requestBody.messages.length,
    systemMessageLength: requestBody.messages[0].content.length,
    temperature: requestBody.temperature,
    max_tokens: requestBody.max_tokens
  });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response structure:', Object.keys(data));
    console.log('OpenAI usage:', data.usage);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data);
      throw new Error('Unexpected OpenAI response structure');
    }
    
    const content = data.choices[0].message.content;
    console.log('OpenAI response content length:', content?.length);
    console.log('=== OPENAI CALL SUCCESS ===');
    return content;
  } catch (error) {
    console.error('=== OPENAI CALL ERROR ===');
    console.error('OpenAI call failed:', error);
    throw error;
  }
}

export async function callAnthropic(model: string, messages: any[], config: any, supabaseClient: any) {
  // Get Anthropic API key from database
  const anthropicApiKey = await getApiKey(supabaseClient, 'ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const systemPrompt = config.prompt;
  const temperature = config.generation?.temperature;
  const maxTokens = config.generation?.max_response_tokens;

  if (systemPrompt === undefined || temperature === undefined || maxTokens === undefined) {
    throw new Error('Missing required configuration parameters. Please configure the agent completely in the admin panel.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      system: systemPrompt,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Anthropic API error:', response.status, errorData);
    throw new Error(`Anthropic API error: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error('Unexpected Anthropic response structure:', data);
    throw new Error('Unexpected Anthropic response structure');
  }
  
  return data.content[0].text;
}

export async function callPerplexity(model: string, messages: any[], config: any, supabaseClient: any) {
  // Get Perplexity API key from database
  const perplexityApiKey = await getApiKey(supabaseClient, 'PERPLEXITY_API_KEY');
  if (!perplexityApiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const systemPrompt = config.prompt;
  const temperature = config.generation?.temperature;
  const maxTokens = config.generation?.max_response_tokens;

  if (systemPrompt === undefined || temperature === undefined || maxTokens === undefined) {
    throw new Error('Missing required configuration parameters. Please configure the agent completely in the admin panel.');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Perplexity API error:', response.status, errorData);
    throw new Error(`Perplexity API error: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected Perplexity response structure:', data);
    throw new Error('Unexpected Perplexity response structure');
  }
  
  return data.choices[0].message.content;
}
