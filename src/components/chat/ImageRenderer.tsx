
import React from 'react';

interface ImageRendererProps {
  src?: string;
  alt?: string;
  node?: any;
  [key: string]: any;
}

export function ImageRenderer(props: ImageRendererProps) {
  console.log('ImageRenderer: All props received:', props);
  
  // Extract src from various possible prop locations
  const src = props.src || props.node?.properties?.src || props.node?.url;
  const alt = props.alt || props.node?.properties?.alt;
  
  console.log('ImageRenderer: Rendering image component');
  console.log('ImageRenderer: Image src:', src ? `${src.substring(0, 50)}... (length: ${src.length})` : 'EMPTY');
  console.log('ImageRenderer: Image alt:', alt);
  
  // More robust validation of image source
  if (!src || src.trim() === '' || src === 'undefined' || src === 'null') {
    console.error('ImageRenderer: Image source is empty, undefined, or invalid:', src);
    return (
      <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
        <p>Image failed to load: Empty source</p>
        <p className="text-xs mt-1">Alt text: {alt || 'No alt text'}</p>
        <p className="text-xs mt-1">Source value: {String(src)}</p>
        <p className="text-xs mt-1">All props: {JSON.stringify(props, null, 2)}</p>
      </div>
    );
  }

  // Validate base64 data URI format - be more permissive with format
  if (!src.startsWith('data:image/')) {
    console.error('ImageRenderer: Invalid image format, expected data:image/ but got:', src.substring(0, 50));
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
      console.error('ImageRenderer: Base64 content appears to be too short or missing');
      return (
        <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
          <p>Image failed to load: Invalid base64 content</p>
          <p className="text-xs mt-1">Base64 length: {base64Part?.length || 0}</p>
        </div>
      );
    }
  } catch (error) {
    console.error('ImageRenderer: Error parsing base64:', error);
    return (
      <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
        <p>Image failed to load: Base64 parsing error</p>
        <p className="text-xs mt-1">Error: {(error as Error).message}</p>
      </div>
    );
  }

  console.log('ImageRenderer: Image validation passed, rendering img element');

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('ImageRenderer: Image onError event fired');
    console.error('ImageRenderer: Image failed to load in browser, src length:', src?.length);
    console.error('ImageRenderer: Image src preview:', src?.substring(0, 100));
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600';
    errorDiv.innerHTML = `
      <p>Failed to load generated image</p>
      <p class="text-xs mt-1">Source length: ${src?.length || 0}</p>
      <p class="text-xs">Alt: ${alt || 'No alt text'}</p>
      <p class="text-xs">Preview: ${src?.substring(0, 50) || 'No preview'}...</p>
    `;
    e.currentTarget.parentNode?.replaceChild(errorDiv, e.currentTarget);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('ImageRenderer: Image loaded successfully!');
    console.log('ImageRenderer: Loaded image dimensions:', {
      naturalWidth: e.currentTarget.naturalWidth,
      naturalHeight: e.currentTarget.naturalHeight
    });
  };

  return (
    <div className="my-4 text-center">
      <img 
        src={src} 
        alt={alt || 'Generated image'} 
        className="max-w-full h-auto rounded-lg shadow-lg mx-auto" 
        style={{ maxHeight: '512px' }}
        onError={handleError}
        onLoad={handleLoad}
        {...props} 
      />
      {alt && alt !== 'Generated image' && (
        <p className="text-sm text-muted-foreground mt-2 italic">{alt}</p>
      )}
    </div>
  );
}
