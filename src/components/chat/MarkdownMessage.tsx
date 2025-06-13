
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
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
            console.log('MarkdownMessage img component called with src:', src?.substring(0, 100) + '...');
            console.log('Image src type:', typeof src);
            console.log('Image src length:', src?.length || 0);
            
            // Check if src is empty or invalid
            if (!src || src.trim() === '') {
              console.error('Image src is empty or undefined');
              return (
                <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                  <p>Image failed to load: Empty source</p>
                </div>
              );
            }

            // Validate base64 data URI format
            if (!src.startsWith('data:image/')) {
              console.error('Invalid image src format:', src.substring(0, 50));
              return (
                <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
                  <p>Image failed to load: Invalid format</p>
                </div>
              );
            }

            return (
              <img 
                src={src} 
                alt={alt || 'Generated image'} 
                className="max-w-full h-auto rounded-lg shadow-md my-4" 
                onError={(e) => {
                  console.error('Image failed to load:', src?.substring(0, 100) + '...');
                  // Replace with error message instead of hiding
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600';
                  errorDiv.innerHTML = '<p>Failed to load image</p>';
                  e.currentTarget.parentNode?.replaceChild(errorDiv, e.currentTarget);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully, src length:', src?.length || 0);
                }}
                {...props} 
              />
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
