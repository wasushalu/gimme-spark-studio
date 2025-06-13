
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { markdownComponents } from './MarkdownComponents';
import { preprocessMarkdownImages } from '@/utils/imagePreprocessor';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  console.log('MarkdownMessage: Processing content with length:', content?.length || 0);
  console.log('MarkdownMessage: Contains image syntax:', content?.includes('![Generated Image]') || false);
  
  // Pre-process large images before sending to ReactMarkdown
  const processedContent = preprocessMarkdownImages(content);
  
  // Log the difference if any preprocessing occurred
  if (processedContent !== content) {
    console.log('MarkdownMessage: Content was preprocessed for large images');
    console.log('MarkdownMessage: Original length:', content.length);
    console.log('MarkdownMessage: Processed length:', processedContent.length);
  }
  
  // Pre-process images for better rendering
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imageMatches = [];
  let match;
  while ((match = imageRegex.exec(processedContent)) !== null) {
    imageMatches.push({
      fullMatch: match[0],
      altText: match[1],
      src: match[2]
    });
  }
  
  console.log('MarkdownMessage: Found', imageMatches.length, 'images to render');
  imageMatches.forEach((img, index) => {
    console.log(`MarkdownMessage: Image ${index + 1}:`, {
      alt: img.altText,
      srcLength: img.src?.length || 0,
      srcPrefix: img.src?.substring(0, 30) || 'No source',
      isDataUri: img.src?.startsWith('data:') || false,
      isExtractedId: img.src?.startsWith('LARGE_IMAGE_') || false
    });
  });
  
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown components={markdownComponents}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
