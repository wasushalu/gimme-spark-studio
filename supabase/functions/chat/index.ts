
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

import { corsHeaders, handleCorsPreflightRequest } from './cors.ts';
import { getApiKey, getAgentConfigFromDatabase } from './config.ts';
import { getConversationMessages, saveAiResponse } from './messages.ts';
import { generateImage, processImageGenerationRequests, replaceImageSyntaxWithImage, replaceImageSyntaxWithError } from './image-generation.ts';
import { callOpenAI, callAnthropic, callPerplexity } from './ai-providers.ts';
import type { ChatRequest, ChatResponse } from './types.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
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
    const openaiApiKey = await getApiKey(supabaseClient, 'OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.error('OpenAI API key not found in database');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        details: 'Please add your OpenAI API key in the admin panel at /admin/api-keys'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found OpenAI API key in database, length:', openaiApiKey.length);

    const { conversationId, message, agentType, agentConfig, isGuest }: ChatRequest = await req.json();
    
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
      messages = await getConversationMessages(supabaseClient, conversationId);
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
    const imageRequests = processImageGenerationRequests(aiResponse);

    if (imageRequests.length > 0) {
      console.log('Found image generation requests:', imageRequests.length);
      
      // Generate images for each request
      for (const imagePrompt of imageRequests) {
        try {
          const imageUrl = await generateImage(imagePrompt, config, openaiApiKey);
          if (imageUrl) {
            processedResponse = replaceImageSyntaxWithImage(processedResponse, imagePrompt, imageUrl);
          }
        } catch (imageError) {
          console.error('Error generating image:', imageError);
          processedResponse = replaceImageSyntaxWithError(processedResponse, imagePrompt);
        }
      }
    }

    // Save AI response to database only for authenticated users with conversations
    if (conversationId && !isGuest) {
      console.log('Saving AI response to database');
      await saveAiResponse(supabaseClient, conversationId, processedResponse, {
        model: modelName,
        provider: modelProvider,
        temperature: temperature,
        max_response_tokens: maxResponseTokens,
        images_generated: imageRequests.length
      });
    } else {
      console.log('Guest user - AI response not saved to database');
    }

    console.log('=== CHAT FUNCTION SUCCESS ===');
    return new Response(JSON.stringify({ response: processedResponse } as ChatResponse), {
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
