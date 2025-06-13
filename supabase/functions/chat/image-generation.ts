
export async function generateImage(prompt: string, config: any, openaiApiKey: string): Promise<string | null> {
  console.log('Generating image with prompt:', prompt);
  
  try {
    const imageModel = config.model?.image?.model || 'gpt-image-1';
    console.log('Using image model:', imageModel);

    // Build request body based on model capabilities
    const requestBody: any = {
      model: imageModel,
      prompt: prompt,
      n: 1,
      size: '1024x1024'
    };

    // Add model-specific parameters for better quality
    if (imageModel === 'gpt-image-1') {
      // gpt-image-1 specific parameters for high quality output
      requestBody.quality = 'high';
      requestBody.output_format = 'png';
    } else if (imageModel.includes('dall-e-3')) {
      // dall-e-3 parameters
      requestBody.response_format = 'b64_json';
      requestBody.quality = 'hd';
      requestBody.style = 'vivid';
    } else {
      // dall-e-2 fallback
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
    console.log('Image generation response received');
    
    // Handle the response based on model type
    if (data.data && data.data[0]) {
      const imageData = data.data[0];
      
      if (imageModel === 'gpt-image-1') {
        // gpt-image-1 returns base64 directly in the b64_json field
        if (imageData.b64_json) {
          const base64Data = imageData.b64_json;
          const imageUrl = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
          console.log('Generated image with gpt-image-1, size:', base64Data.length);
          return imageUrl;
        }
      } else {
        // dall-e models return base64 in b64_json field when response_format is b64_json
        if (imageData.b64_json) {
          const base64Data = imageData.b64_json;
          const imageUrl = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
          console.log('Generated image with DALL-E, size:', base64Data.length);
          return imageUrl;
        }
      }
    }
    
    console.error('Unexpected image generation response structure:', data);
    return null;
  } catch (error) {
    console.error('Error in generateImage:', error);
    return null;
  }
}

export function processImageGenerationRequests(aiResponse: string): string[] {
  // Enhanced regex to catch more natural image generation requests
  const imageGenerationRegex = /\[GENERATE_IMAGE:\s*([^\]]+)\]/g;
  const imageRequests = [];
  let match;

  while ((match = imageGenerationRegex.exec(aiResponse)) !== null) {
    imageRequests.push(match[1].trim());
  }

  console.log('Found image generation requests:', imageRequests);
  return imageRequests;
}

export function replaceImageSyntaxWithImage(response: string, imagePrompt: string, imageUrl: string): string {
  console.log('Replacing image syntax for prompt:', imagePrompt);
  
  const originalSyntax = `[GENERATE_IMAGE: ${imagePrompt}]`;
  const replacement = `![Generated Image](${imageUrl})\n\n*Generated image: ${imagePrompt}*`;
  
  const updatedResponse = response.replace(originalSyntax, replacement);
  console.log('Image replacement successful:', updatedResponse !== response);
  
  return updatedResponse;
}

export function replaceImageSyntaxWithError(response: string, imagePrompt: string): string {
  console.log('Replacing image syntax with error for prompt:', imagePrompt);
  
  const originalSyntax = `[GENERATE_IMAGE: ${imagePrompt}]`;
  const replacement = `*[Image generation failed: ${imagePrompt}]*`;
  
  return response.replace(originalSyntax, replacement);
}

// Enhanced function to suggest when agents should generate images
export function enhancePromptForImageGeneration(systemPrompt: string): string {
  const imageGenerationGuidance = `

When responding to user requests, you can generate images to enhance your responses using the syntax: [GENERATE_IMAGE: detailed description]

Generate images when:
- User explicitly asks for an image or visual content
- User mentions food, recipes, or cooking (generate food images)
- User asks about visual concepts, designs, or creative ideas
- User requests examples that would benefit from visual representation
- User asks about places, locations, or travel
- The response would be significantly enhanced with a visual element

For image prompts, be specific and descriptive. Include:
- Visual style (photographic, illustration, artistic style)
- Composition and framing details
- Colors, lighting, and mood
- Specific details about the subject matter

Example: Instead of [GENERATE_IMAGE: butter chicken], use [GENERATE_IMAGE: A professional food photography shot of creamy butter chicken curry in a dark ceramic bowl, garnished with fresh cilantro and served with naan bread, warm golden lighting, appetizing presentation]`;

  return systemPrompt + imageGenerationGuidance;
}
