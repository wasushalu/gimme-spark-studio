import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  console.log('MarkdownMessage received content length:', content?.length || 0);
  console.log('MarkdownMessage content preview:', content?.substring(0, 200) || 'NO CONTENT');
  console.log('MarkdownMessage contains ![Generated Image]:', content?.includes('![Generated Image]') || false);
  
  // Extract image data directly from markdown before ReactMarkdown processes it
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
  
  console.log('Direct regex image matches:', imageMatches.length);
  imageMatches.forEach((img, index) => {
    console.log(`Image ${index + 1}:`, {
      altText: img.altText,
      srcLength: img.src?.length || 0,
      srcPreview: img.src?.substring(0, 100) || 'NO SRC',
      isDataUri: img.src?.startsWith('data:image/') || false
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
          img({ src, alt, node, ...props }) {
            console.log('MarkdownMessage img component called');
            console.log('Image props received:', { 
              src: src?.substring(0, 100) + '...',
              srcLength: src?.length || 0,
              alt, 
              nodeType: node?.tagName,
              allProps: Object.keys(props)
            });
            
            // If ReactMarkdown didn't parse the src correctly, try to find it manually
            let actualSrc = src;
            if (!src || src.trim() === '') {
              console.log('ReactMarkdown failed to parse src, searching manually...');
              
              // Find the image in our pre-parsed matches
              const matchingImage = imageMatches.find(img => 
                img.altText === alt || 
                (alt && img.altText.includes(alt)) ||
                (alt === 'Generated Image' && img.altText === 'Generated Image')
              );
              
              if (matchingImage) {
                actualSrc = matchingImage.src;
                console.log('Found matching image manually:', {
                  srcLength: actualSrc?.length || 0,
                  srcPreview: actualSrc?.substring(0, 100) || 'NO SRC'
                });
              }
            }

            console.log('Final src to use:', {
              srcLength: actualSrc?.length || 0,
              srcPreview: actualSrc?.substring(0, 100) || 'NO SRC',
              isDataUri: actualSrc?.startsWith('data:image/') || false
            });

            // Check if src is empty or invalid
            if (!actualSrc || actualSrc.trim() === '') {
              console.error('Image src is empty or undefined');
              return (
                <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                  <p>Image failed to load: Empty source</p>
                  <p className="text-xs mt-1">Alt text: {alt || 'No alt text'}</p>
                  <p className="text-xs">Available images: {imageMatches.length}</p>
                  {imageMatches.length > 0 && (
                    <p className="text-xs">First image src length: {imageMatches[0].src?.length || 0}</p>
                  )}
                </div>
              );
            }

            // Validate base64 data URI format
            if (!actualSrc.startsWith('data:image/')) {
              console.error('Invalid image src format. Expected data:image/, got:', actualSrc.substring(0, 50));
              return (
                <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                  <p>Image failed to load: Invalid format</p>
                  <p className="text-xs mt-1">Expected data:image/ prefix</p>
                  <p className="text-xs">Got: {actualSrc.substring(0, 50)}...</p>
                </div>
              );
            }

            console.log('Image validation passed, rendering image element');
            
            return (
              <div className="my-4">
                <img 
                  src={actualSrc} 
                  alt={alt || 'Generated image'} 
                  className="max-w-full h-auto rounded-lg shadow-md" 
                  onError={(e) => {
                    console.error('Image failed to load in browser');
                    console.error('Image src length:', actualSrc?.length || 0);
                    console.error('Image src preview:', actualSrc?.substring(0, 100) || 'NO SRC');
                    
                    // Replace with error message
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600';
                    errorDiv.innerHTML = `
                      <p>Failed to load image in browser</p>
                      <p class="text-xs mt-1">Source length: ${actualSrc?.length || 0}</p>
                      <p class="text-xs">Alt: ${alt || 'No alt text'}</p>
                    `;
                    e.currentTarget.parentNode?.replaceChild(errorDiv, e.currentTarget);
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully!');
                    console.log('Loaded image src length:', actualSrc?.length || 0);
                  }}
                  {...props} 
                />
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
