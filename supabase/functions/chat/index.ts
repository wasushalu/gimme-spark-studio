
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
    const { conversationId, message, agentType, agentConfig, isGuest } = await req.json();
    
    console.log('Chat function called with:', { 
      conversationId, 
      agentType, 
      hasAgentConfig: !!agentConfig,
      agentConfigKeys: agentConfig ? Object.keys(agentConfig) : [],
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // Use agent configuration if available, otherwise fallback to basic defaults
    let config;
    if (agentConfig && typeof agentConfig === 'object') {
      console.log('Using provided agent config');
      config = {
        model: agentConfig.model || { text: { provider: 'openai', model: 'gpt-4o-mini' } },
        generation: agentConfig.generation || { temperature: 0.7, max_response_tokens: 4000 },
        prompt: agentConfig.prompt || getDefaultPrompt(agentType)
      };
    } else {
      console.log('No valid agent config provided, using fallback for agent type:', agentType);
      config = {
        model: { text: { provider: 'openai', model: 'gpt-4o-mini' } },
        generation: { temperature: 0.7, max_response_tokens: 4000 },
        prompt: getDefaultPrompt(agentType)
      };
    }

    console.log('Final config:', {
      modelProvider: config.model?.text?.provider,
      modelName: config.model?.text?.model,
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
        console.log('Calling OpenAI with model:', textModel.model);
        aiResponse = await callOpenAI(textModel.model, conversationHistory, config);
      } else if (textModel?.provider === 'anthropic') {
        console.log('Calling Anthropic with model:', textModel.model);
        aiResponse = await callAnthropic(textModel.model, conversationHistory, config);
      } else if (textModel?.provider === 'perplexity') {
        console.log('Calling Perplexity with model:', textModel.model);
        aiResponse = await callPerplexity(textModel.model, conversationHistory, config);
      } else {
        // Default to OpenAI if provider not recognized
        console.log('Unknown provider, defaulting to OpenAI');
        aiResponse = await callOpenAI('gpt-4o-mini', conversationHistory, config);
      }
    } catch (aiError) {
      console.error('Error calling AI service:', aiError);
      return new Response(JSON.stringify({ 
        error: 'Failed to get AI response',
        details: aiError.message
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
            model: textModel?.model || 'gpt-4o-mini',
            provider: textModel?.provider || 'openai',
            temperature: config.generation?.temperature || 0.7
          }
        });

      if (saveError) {
        console.error('Error saving AI response:', saveError);
        // Don't fail the request if saving fails, just log the error
        console.warn('Continuing despite save error');
      } else {
        console.log('AI response saved successfully');
      }
    } else {
      console.log('Guest user - AI response not saved to database');
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDefaultPrompt(agentType: string): string {
  switch (agentType) {
    case 'gimmebot':
      return 'You are gimmebot, a helpful marketing assistant at gimmefy.ai. You help users with marketing questions and guide them through gimmefy features. Always be friendly, helpful, and remember to use "gimmefy" with a lowercase g.';
    case 'creative_concept':
      return 'You are a creative AI assistant specialized in brainstorming and developing creative concepts. Help users generate innovative ideas and creative solutions.';
    case 'neutral_chat':
      return 'You are Jack, a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions.';
    default:
      return 'You are a helpful AI assistant.';
  }
}

async function callOpenAI(model: string, messages: any[], config: any) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = config.prompt || 'You are a helpful assistant.';
  const temperature = config.generation?.temperature || 0.7;
  const maxTokens = config.generation?.max_response_tokens || 4000;

  console.log('OpenAI call with system prompt length:', systemPrompt.length);
  console.log('OpenAI messages count:', messages.length);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
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
    console.error('OpenAI API error:', response.status, errorData);
    throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  console.log('OpenAI response structure:', Object.keys(data));
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected OpenAI response structure:', data);
    throw new Error('Unexpected OpenAI response structure');
  }
  
  return data.choices[0].message.content;
}

async function callAnthropic(model: string, messages: any[], config: any) {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
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

async function callPerplexity(model: string, messages: any[], config: any) {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
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
