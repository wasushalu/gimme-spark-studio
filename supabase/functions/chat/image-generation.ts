
export async function generateImage(prompt: string, config: any, openaiApiKey: string): Promise<string | null> {
  console.log('Generating image with prompt:', prompt);
  
  try {
    const imageModel = config.model?.image?.model || 'dall-e-3';
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
          const imageUrl = `data:image/png;base64,${imageData.b64_json}`;
          console.log('Image generated successfully with gpt-image-1');
          return imageUrl;
        } else {
          console.error('gpt-image-1 response missing b64_json field:', imageData);
          return null;
        }
      } else {
        // dall-e models return base64 in b64_json field when response_format is b64_json
        if (imageData.b64_json) {
          const imageUrl = `data:image/png;base64,${imageData.b64_json}`;
          console.log('Image generated successfully with DALL-E');
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

  return imageRequests;
}

export function replaceImageSyntaxWithImage(response: string, imagePrompt: string, imageUrl: string): string {
  return response.replace(
    `[GENERATE_IMAGE: ${imagePrompt}]`,
    `![Generated Image](${imageUrl})\n\n*Generated image: ${imagePrompt}*`
  );
}

export function replaceImageSyntaxWithError(response: string, imagePrompt: string): string {
  return response.replace(
    `[GENERATE_IMAGE: ${imagePrompt}]`,
    `*[Image generation failed: ${imagePrompt}]*`
  );
}
