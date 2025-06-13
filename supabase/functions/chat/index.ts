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

    // Get agent configuration from database - MUST have config to proceed
    let config;
    if (agentConfig && typeof agentConfig === 'object') {
      console.log('Using provided agent config from request');
      config = agentConfig;
    } else {
      console.log('No agent config provided, fetching from database for agent type:', agentType);
      const dbConfig = await getAgentConfigFromDatabase(supabaseClient, agentType);
      if (!dbConfig) {
        return new Response(JSON.stringify({ 
          error: 'Agent configuration not found',
          details: `No active configuration found for agent ${agentType}. Please configure the agent in the admin panel.`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      config = dbConfig;
    }

    // Validate required configuration
    if (!config.prompt) {
      console.error('No system prompt found in agent configuration');
      return new Response(JSON.stringify({ 
        error: 'Invalid agent configuration',
        details: 'System prompt is required but not configured. Please set up the agent prompt in the admin panel.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use configuration values from database - NO HARDCODED FALLBACKS
    const modelProvider = config.model?.text?.provider;
    const modelName = config.model?.text?.model;
    const temperature = config.generation?.temperature;
    const maxResponseTokens = config.generation?.max_response_tokens;
    const maxContextTokens = config.generation?.max_context_tokens;

    if (!modelProvider || !modelName) {
      console.error('Model configuration missing');
      return new Response(JSON.stringify({ 
        error: 'Invalid model configuration',
        details: 'Model provider and name must be configured in the admin panel.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Using configuration from database:', {
      modelProvider,
      modelName,
      promptLength: config.prompt?.length,
      temperature,
      maxResponseTokens,
      maxContextTokens
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

    // Enhance system prompt with image generation capability
    const enhancedSystemPrompt = `${config.prompt}

IMPORTANT: You have access to image generation capabilities. When a user requests an image, asks for visual content, or when you determine that an image would significantly enhance your response, you can generate images by including the following special syntax in your response:

[GENERATE_IMAGE: detailed description of the image to generate]

For example:
- If user asks "show me a logo for a coffee shop", respond with: [GENERATE_IMAGE: modern minimalist coffee shop logo with a stylized coffee cup, warm brown and cream colors, clean typography]
- If discussing marketing concepts, you might include: [GENERATE_IMAGE: infographic showing marketing funnel stages with icons and connecting arrows]

The image generation will happen automatically when this syntax is detected. Be creative and use this capability to enhance your responses with relevant visuals when appropriate.`;

    // Determine which AI service to use based on the configured model
    let aiResponse;

    try {
      if (modelProvider === 'openai') {
        console.log('Calling OpenAI with model:', modelName);
        aiResponse = await callOpenAI(modelName, conversationHistory, { ...config, prompt: enhancedSystemPrompt }, openaiApiKey);
      } else if (modelProvider === 'anthropic') {
        console.log('Calling Anthropic with model:', modelName);
        aiResponse = await callAnthropic(modelName, conversationHistory, { ...config, prompt: enhancedSystemPrompt }, supabaseClient);
      } else if (modelProvider === 'perplexity') {
        console.log('Calling Perplexity with model:', modelName);
        aiResponse = await callPerplexity(modelName, conversationHistory, { ...config, prompt: enhancedSystemPrompt }, supabaseClient);
      } else {
        console.error('Unsupported model provider:', modelProvider);
        return new Response(JSON.stringify({ 
          error: 'Unsupported model provider',
          details: `Provider '${modelProvider}' is not supported. Please configure a supported provider in the admin panel.`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (aiError) {
      console.error('Error calling AI service:', aiError);
      return new Response(JSON.stringify({ 
        error: 'Failed to get AI response',
        details: aiError.message,
        provider: modelProvider,
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

    // Process AI response for image generation requests
    let processedResponse = aiResponse;
    const imageGenerationRegex = /\[GENERATE_IMAGE:\s*([^\]]+)\]/g;
    const imageRequests = [];
    let match;

    while ((match = imageGenerationRegex.exec(aiResponse)) !== null) {
      imageRequests.push(match[1].trim());
    }

    if (imageRequests.length > 0) {
      console.log('Found image generation requests:', imageRequests.length);
      
      // Generate images for each request
      for (const imagePrompt of imageRequests) {
        try {
          const imageUrl = await generateImage(imagePrompt, config, openaiApiKey);
          if (imageUrl) {
            // Replace the image generation syntax with the actual image
            processedResponse = processedResponse.replace(
              `[GENERATE_IMAGE: ${imagePrompt}]`,
              `![Generated Image](${imageUrl})\n\n*Generated image: ${imagePrompt}*`
            );
          }
        } catch (imageError) {
          console.error('Error generating image:', imageError);
          // Replace with error message
          processedResponse = processedResponse.replace(
            `[GENERATE_IMAGE: ${imagePrompt}]`,
            `*[Image generation failed: ${imagePrompt}]*`
          );
        }
      }
    }

    // Save AI response to database only for authenticated users with conversations
    if (conversationId && !isGuest) {
      console.log('Saving AI response to database');
      const { error: saveError } = await supabaseClient
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: processedResponse,
          metadata: {
            model: modelName,
            provider: modelProvider,
            temperature: temperature,
            max_response_tokens: maxResponseTokens,
            images_generated: imageRequests.length
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
    return new Response(JSON.stringify({ response: processedResponse }), {
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

async function generateImage(prompt: string, config: any, openaiApiKey: string): Promise<string | null> {
  console.log('Generating image with prompt:', prompt);
  
  try {
    const imageModel = config.model?.image?.model || 'gpt-image-1';
    console.log('Using image model:', imageModel);

    // Build request body based on model capabilities
    const requestBody: any = {
      model: imageModel,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    };

    // Only add response_format for models that support it (not gpt-image-1)
    if (imageModel !== 'gpt-image-1') {
      requestBody.response_format = 'b64_json';
      requestBody.quality = 'standard';
    }

    console.log('Image generation request body:', requestBody);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    // Handle different response formats
    if (imageModel === 'gpt-image-1') {
      // gpt-image-1 always returns base64 directly
      if (data.data && data.data[0] && data.data[0].b64_json) {
        const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
        console.log('Image generated successfully with gpt-image-1');
        return imageUrl;
      }
    } else {
      // Other models with b64_json response format
      if (data.data && data.data[0] && data.data[0].b64_json) {
        const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
        console.log('Image generated successfully');
        return imageUrl;
      }
    }
    
    console.error('Unexpected image generation response structure:', data);
    return null;
  } catch (error) {
    console.error('Error in generateImage:', error);
    return null;
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

async function getAgentConfigFromDatabase(supabaseClient: any, agentType: string) {
  const { data: configData, error: configError } = await supabaseClient
    .from('agent_config_versions')
    .select('*')
    .eq('agent_id', agentType)
    .eq('is_active', true)
    .maybeSingle();

  if (configError) {
    console.error('Error fetching agent config from database:', configError);
    return null;
  }

  return configData?.settings || null;
}
