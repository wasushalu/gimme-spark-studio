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
            console.log('MarkdownMessage: Rendering image with alt:', alt);
            console.log('MarkdownMessage: Image src length:', src?.length || 0);
            
            // Validate image source
            if (!src || src.trim() === '') {
              console.error('MarkdownMessage: Empty image source');
              return (
                <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                  <p>Image failed to load: Empty source</p>
                  <p className="text-xs mt-1">Alt text: {alt || 'No alt text'}</p>
                </div>
              );
            }

            // Validate base64 data URI format
            if (!src.startsWith('data:image/')) {
              console.error('MarkdownMessage: Invalid image format, expected data:image/');
              return (
                <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                  <p>Image failed to load: Invalid format</p>
                  <p className="text-xs mt-1">Expected data:image/ prefix</p>
                </div>
              );
            }

            return (
              <div className="my-4 text-center">
                <img 
                  src={src} 
                  alt={alt || 'Generated image'} 
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto" 
                  style={{ maxHeight: '512px' }}
                  onError={(e) => {
                    console.error('MarkdownMessage: Image failed to load in browser');
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600';
                    errorDiv.innerHTML = `
                      <p>Failed to load generated image</p>
                      <p class="text-xs mt-1">Source length: ${src?.length || 0}</p>
                      <p class="text-xs">Alt: ${alt || 'No alt text'}</p>
                    `;
                    e.currentTarget.parentNode?.replaceChild(errorDiv, e.currentTarget);
                  }}
                  onLoad={() => {
                    console.log('MarkdownMessage: Image loaded successfully');
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
