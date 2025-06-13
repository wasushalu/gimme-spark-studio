
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeRendererProps {
  node?: any;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

export function CodeRenderer({ node, className, children, ...props }: CodeRendererProps) {
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
}
