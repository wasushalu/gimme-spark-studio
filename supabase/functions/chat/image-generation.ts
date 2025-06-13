
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

    // Add model-specific parameters
    if (imageModel === 'gpt-image-1') {
      // gpt-image-1 specific parameters (no response_format, always returns base64)
      requestBody.quality = 'high'; // gpt-image-1 uses: low, medium, high, auto
    } else {
      // dall-e models
      requestBody.response_format = 'b64_json';
      requestBody.quality = 'standard'; // dall-e uses: standard, hd
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
    console.log('Response data structure:', Object.keys(data));
    
    // Handle the response based on model type
    if (data.data && data.data[0]) {
      const imageData = data.data[0];
      console.log('Image data keys:', Object.keys(imageData));
      
      if (imageModel === 'gpt-image-1') {
        // gpt-image-1 returns base64 directly in the b64_json field
        if (imageData.b64_json) {
          const base64Data = imageData.b64_json;
          console.log('Base64 data length for gpt-image-1:', base64Data.length);
          // Ensure we have proper base64 data URI format
          const imageUrl = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
          console.log('Final image URL format for gpt-image-1:', imageUrl.substring(0, 50) + '...');
          return imageUrl;
        } else {
          console.error('gpt-image-1 response missing b64_json field:', imageData);
          return null;
        }
      } else {
        // dall-e models return base64 in b64_json field when response_format is b64_json
        if (imageData.b64_json) {
          const base64Data = imageData.b64_json;
          console.log('Base64 data length for DALL-E:', base64Data.length);
          // Ensure we have proper base64 data URI format
          const imageUrl = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
          console.log('Final image URL format for DALL-E:', imageUrl.substring(0, 50) + '...');
          return imageUrl;
        } else {
          console.error('DALL-E response missing b64_json field:', imageData);
          return null;
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
  console.log('With image URL (first 100 chars):', imageUrl.substring(0, 100) + '...');
  
  const originalSyntax = `[GENERATE_IMAGE: ${imagePrompt}]`;
  const replacement = `![Generated Image](${imageUrl})\n\n*Generated image: ${imagePrompt}*`;
  
  console.log('Original syntax:', originalSyntax);
  console.log('Replacement syntax:', replacement.substring(0, 100) + '...');
  
  const updatedResponse = response.replace(originalSyntax, replacement);
  console.log('Response updated:', updatedResponse !== response);
  
  return updatedResponse;
}

export function replaceImageSyntaxWithError(response: string, imagePrompt: string): string {
  console.log('Replacing image syntax with error for prompt:', imagePrompt);
  
  const originalSyntax = `[GENERATE_IMAGE: ${imagePrompt}]`;
  const replacement = `*[Image generation failed: ${imagePrompt}]*`;
  
  return response.replace(originalSyntax, replacement);
}
