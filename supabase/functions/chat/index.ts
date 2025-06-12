
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CHAT FUNCTION START ===');
    console.log('Request method:', req.method);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get OpenAI API key from database
    console.log('Fetching OpenAI API key from database...');
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('api_keys_storage')
      .select('key_value')
      .eq('key_name', 'OPENAI_API_KEY')
      .maybeSingle();

    if (apiKeyError) {
      console.error('Error fetching API key:', apiKeyError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch API key configuration',
        details: apiKeyError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!apiKeyData?.key_value) {
      console.error('OpenAI API key not found in database');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        details: 'Please add your OpenAI API key in the admin panel at /admin/api-keys'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openaiApiKey = apiKeyData.key_value;
    console.log('Found OpenAI API key in database, length:', openaiApiKey.length);

    const { conversationId, message, agentType, agentConfig, isGuest } = await req.json();
    
    console.log('Request payload parsed:', { 
      conversationId, 
      agentType, 
      hasAgentConfig: !!agentConfig,
      messageLength: message?.length,
      isGuest: !!isGuest
    });

    if (!message) {
      console.error('Message is required but not provided');
      return new Response(JSON.stringify({ 
        error: 'Message is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get conversation messages for context (only for authenticated users with conversations)
    let messages = [];
    if (conversationId && !isGuest) {
      console.log('Fetching conversation messages for authenticated user');
      const { data: conversationMessages, error: messagesError } = await supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch conversation messages',
          details: messagesError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      messages = conversationMessages || [];
      console.log(`Found ${messages.length} messages in conversation`);
    } else {
      console.log('Guest user or no conversation - starting fresh conversation');
    }

    // Get agent configuration from database if not provided
    let config;
    if (agentConfig && typeof agentConfig === 'object') {
      console.log('Using provided agent config');
      config = {
        model: agentConfig.model || { text: { provider: 'openai', model: 'gpt-4o-mini' } },
        generation: agentConfig.generation || { temperature: 0.7, max_response_tokens: 4000 },
        prompt: agentConfig.prompt || await getAgentPromptFromDatabase(supabaseClient, agentType)
      };
    } else {
      console.log('No agent config provided, fetching from database for agent type:', agentType);
      const dbPrompt = await getAgentPromptFromDatabase(supabaseClient, agentType);
      config = {
        model: { text: { provider: 'openai', model: 'gpt-4o-mini' } },
        generation: { temperature: 0.7, max_response_tokens: 4000 },
        prompt: dbPrompt
      };
    }

    // Normalize model names to ensure compatibility with OpenAI API
    let modelName = config.model?.text?.model || 'gpt-4o-mini';
    if (modelName === 'gpt-4.1-2025-04-14') {
      modelName = 'gpt-4o';
    } else if (modelName === 'o4-mini-2025-04-16') {
      modelName = 'gpt-4o-mini';
    } else if (modelName === 'o3-2025-04-16') {
      modelName = 'gpt-4o'; // fallback to gpt-4o for o3
    }

    console.log('Final config:', {
      modelProvider: config.model?.text?.provider,
      originalModelName: config.model?.text?.model,
      normalizedModelName: modelName,
      promptLength: config.prompt?.length,
      temperature: config.generation?.temperature
    });

    // Build conversation history and add current message
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add the current user message to the conversation
    conversationHistory.push({
      role: 'user',
      content: message
    });

    console.log('Conversation history:', conversationHistory.length, 'messages');

    // Determine which AI service to use based on the configured model
    const textModel = config.model?.text;
    let aiResponse;

    try {
      if (textModel?.provider === 'openai') {
        console.log('Calling OpenAI with model:', modelName);
        aiResponse = await callOpenAI(modelName, conversationHistory, config, openaiApiKey);
      } else if (textModel?.provider === 'anthropic') {
        console.log('Calling Anthropic with model:', modelName);
        aiResponse = await callAnthropic(modelName, conversationHistory, config, supabaseClient);
      } else if (textModel?.provider === 'perplexity') {
        console.log('Calling Perplexity with model:', modelName);
        aiResponse = await callPerplexity(modelName, conversationHistory, config, supabaseClient);
      } else {
        // Default to OpenAI if provider not recognized
        console.log('Unknown provider, defaulting to OpenAI');
        aiResponse = await callOpenAI('gpt-4o-mini', conversationHistory, config, openaiApiKey);
      }
    } catch (aiError) {
      console.error('Error calling AI service:', aiError);
      return new Response(JSON.stringify({ 
        error: 'Failed to get AI response',
        details: aiError.message,
        provider: textModel?.provider || 'openai',
        model: modelName
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('AI response received, length:', aiResponse?.length);

    if (!aiResponse) {
      console.error('AI response is empty or null');
      return new Response(JSON.stringify({ 
        error: 'AI response is empty' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save AI response to database only for authenticated users with conversations
    if (conversationId && !isGuest) {
      console.log('Saving AI response to database');
      const { error: saveError } = await supabaseClient
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
          metadata: {
            model: modelName,
            provider: textModel?.provider || 'openai',
            temperature: config.generation?.temperature || 0.7
          }
        });

      if (saveError) {
        console.error('Error saving AI response:', saveError);
        console.warn('Continuing despite save error');
      } else {
        console.log('AI response saved successfully');
      }
    } else {
      console.log('Guest user - AI response not saved to database');
    }

    console.log('=== CHAT FUNCTION SUCCESS ===');
    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== CHAT FUNCTION ERROR ===');
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getAgentPromptFromDatabase(supabaseClient: any, agentType: string): Promise<string> {
  try {
    console.log('Fetching agent prompt from database for:', agentType);
    
    // First try to get the active configuration for this agent
    const { data: configData, error: configError } = await supabaseClient
      .from('agent_config_versions')
      .select('settings')
      .eq('agent_id', agentType)
      .eq('is_active', true)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching agent config:', configError);
    } else if (configData?.settings?.prompt) {
      console.log('Found agent prompt in database, length:', configData.settings.prompt.length);
      return configData.settings.prompt;
    }

    // Fallback: check if agent exists in agents table
    const { data: agentData, error: agentError } = await supabaseClient
      .from('agents')
      .select('*')
      .eq('agent_id', agentType)
      .maybeSingle();

    if (agentError) {
      console.error('Error fetching agent:', agentError);
    } else if (agentData) {
      console.log('Found agent in database:', agentData.label);
      // Return a generic prompt based on agent type
      return `You are ${agentData.label}, a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions.`;
    }

    // Final fallback
    console.log('No agent configuration found in database, using minimal fallback');
    return 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions.';
    
  } catch (error) {
    console.error('Error in getAgentPromptFromDatabase:', error);
    return 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions.';
  }
}

async function callOpenAI(model: string, messages: any[], config: any, apiKey: string) {
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

  const systemPrompt = config.prompt || 'You are a helpful assistant.';
  const temperature = config.generation?.temperature || 0.7;
  const maxTokens = config.generation?.max_response_tokens || 4000;

  console.log('OpenAI call parameters:', {
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

  console.log('OpenAI request body:', JSON.stringify(requestBody, null, 2));

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

async function callAnthropic(model: string, messages: any[], config: any, supabaseClient: any) {
  // Get Anthropic API key from database
  const { data: apiKeyData } = await supabaseClient
    .from('api_keys_storage')
    .select('key_value')
    .eq('key_name', 'ANTHROPIC_API_KEY')
    .maybeSingle();

  const anthropicApiKey = apiKeyData?.key_value;
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const systemPrompt = config.prompt || 'You are a helpful assistant.';
  const temperature = config.generation?.temperature || 0.7;
  const maxTokens = config.generation?.max_response_tokens || 4000;

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

async function callPerplexity(model: string, messages: any[], config: any, supabaseClient: any) {
  // Get Perplexity API key from database
  const { data: apiKeyData } = await supabaseClient
    .from('api_keys_storage')
    .select('key_value')
    .eq('key_name', 'PERPLEXITY_API_KEY')
    .maybeSingle();

  const perplexityApiKey = apiKeyData?.key_value;
  if (!perplexityApiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const systemPrompt = config.prompt || 'You are a helpful assistant.';
  const temperature = config.generation?.temperature || 0.7;
  const maxTokens = config.generation?.max_response_tokens || 4000;

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
