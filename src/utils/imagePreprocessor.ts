
interface ExtractedImage {
  id: string;
  src: string;
  alt: string;
}

const IMAGE_SIZE_THRESHOLD = 500 * 1024; // 500KB
const extractedImages = new Map<string, ExtractedImage>();

export function preprocessMarkdownImages(content: string): string {
  // Clear previous images
  extractedImages.clear();
  
  // Regex to find markdown images with base64 data
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let processedContent = content;
  let imageCounter = 0;
  
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    const [fullMatch, altText, src] = match;
    
    // Check if it's a large base64 image
    if (src.startsWith('data:image/') && src.length > IMAGE_SIZE_THRESHOLD) {
      imageCounter++;
      const imageId = `LARGE_IMAGE_${imageCounter}`;
      
      // Store the extracted image
      extractedImages.set(imageId, {
        id: imageId,
        src: src,
        alt: altText || 'Generated Image'
      });
      
      // Replace with placeholder
      processedContent = processedContent.replace(
        fullMatch,
        `![${altText}](${imageId})`
      );
      
      console.log(`Preprocessor: Extracted large image ${imageId}, size: ${src.length} chars`);
    }
  }
  
  console.log(`Preprocessor: Processed ${imageCounter} large images`);
  return processedContent;
}

export function getExtractedImage(imageId: string): ExtractedImage | undefined {
  return extractedImages.get(imageId);
}

export function isExtractedImageId(src: string): boolean {
  return src.startsWith('LARGE_IMAGE_');
}
