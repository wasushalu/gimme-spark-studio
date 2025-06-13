import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  console.log('MarkdownMessage: Processing content with length:', content?.length || 0);
  console.log('MarkdownMessage: Contains image syntax:', content?.includes('![Generated Image]') || false);
  
  // Pre-process images for better rendering
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imageMatches = [];
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
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
      isDataUri: img.src?.startsWith('data:') || false
    });
  });
  
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !node || node.tagName !== 'pre';
            
            return !isInline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-lg !mt-2 !mb-2"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code 
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" 
                {...props}
              >
                {children}
              </code>
            );
          },
          img({ src, alt, ...props }) {
            console.log('MarkdownMessage: Rendering image component');
            console.log('MarkdownMessage: Image src:', src ? `${src.substring(0, 50)}... (length: ${src.length})` : 'EMPTY');
            console.log('MarkdownMessage: Image alt:', alt);
            
            // More robust validation of image source
            if (!src || src.trim() === '' || src === 'undefined' || src === 'null') {
              console.error('MarkdownMessage: Image source is empty, undefined, or invalid:', src);
              return (
                <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                  <p>Image failed to load: Empty source</p>
                  <p className="text-xs mt-1">Alt text: {alt || 'No alt text'}</p>
                  <p className="text-xs mt-1">Source value: {String(src)}</p>
                </div>
              );
            }

            // Validate base64 data URI format - be more permissive with format
            if (!src.startsWith('data:image/')) {
              console.error('MarkdownMessage: Invalid image format, expected data:image/ but got:', src.substring(0, 50));
              return (
                <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                  <p>Image failed to load: Invalid format</p>
                  <p className="text-xs mt-1">Expected data:image/ prefix</p>
                  <p className="text-xs mt-1">Received: {src.substring(0, 50)}...</p>
                </div>
              );
            }

            // Additional validation for base64 content
            try {
              const base64Part = src.split(',')[1];
              if (!base64Part || base64Part.length < 100) {
                console.error('MarkdownMessage: Base64 content appears to be too short or missing');
                return (
                  <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                    <p>Image failed to load: Invalid base64 content</p>
                    <p className="text-xs mt-1">Base64 length: {base64Part?.length || 0}</p>
                  </div>
                );
              }
            } catch (error) {
              console.error('MarkdownMessage: Error parsing base64:', error);
              return (
                <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                  <p>Image failed to load: Base64 parsing error</p>
                  <p className="text-xs mt-1">Error: {error.message}</p>
                </div>
              );
            }

            console.log('MarkdownMessage: Image validation passed, rendering img element');

            return (
              <div className="my-4 text-center">
                <img 
                  src={src} 
                  alt={alt || 'Generated image'} 
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto" 
                  style={{ maxHeight: '512px' }}
                  onError={(e) => {
                    console.error('MarkdownMessage: Image onError event fired');
                    console.error('MarkdownMessage: Image failed to load in browser, src length:', src?.length);
                    console.error('MarkdownMessage: Image src preview:', src?.substring(0, 100));
                    
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600';
                    errorDiv.innerHTML = `
                      <p>Failed to load generated image</p>
                      <p class="text-xs mt-1">Source length: ${src?.length || 0}</p>
                      <p class="text-xs">Alt: ${alt || 'No alt text'}</p>
                      <p class="text-xs">Preview: ${src?.substring(0, 50) || 'No preview'}...</p>
                    `;
                    e.currentTarget.parentNode?.replaceChild(errorDiv, e.currentTarget);
                  }}
                  onLoad={() => {
                    console.log('MarkdownMessage: Image loaded successfully!');
                    console.log('MarkdownMessage: Loaded image dimensions:', {
                      naturalWidth: (e.target as HTMLImageElement).naturalWidth,
                      naturalHeight: (e.target as HTMLImageElement).naturalHeight
                    });
                  }}
                  {...props} 
                />
                {alt && alt !== 'Generated image' && (
                  <p className="text-sm text-muted-foreground mt-2 italic">{alt}</p>
                )}
              </div>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium mb-2 mt-3 first:mt-0">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic my-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
