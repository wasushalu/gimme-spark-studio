
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getExtractedImage, isExtractedImageId } from '@/utils/imagePreprocessor';

interface ImageRendererProps {
  src?: string;
  alt?: string;
  node?: any;
  [key: string]: any;
}

export function ImageRenderer(props: ImageRendererProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  
  console.log('ImageRenderer: All props received:', props);
  
  // Extract src from various possible prop locations
  let src = props.src || props.node?.properties?.src || props.node?.url;
  let alt = props.alt || props.node?.properties?.alt;
  
  // Check if this is a placeholder for an extracted large image
  if (src && isExtractedImageId(src)) {
    console.log('ImageRenderer: Detected extracted image placeholder:', src);
    const extractedImage = getExtractedImage(src);
    if (extractedImage) {
      src = extractedImage.src;
      alt = extractedImage.alt;
      console.log('ImageRenderer: Restored large image, size:', src.length);
    } else {
      console.error('ImageRenderer: Could not find extracted image for ID:', src);
    }
  }
  
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
      </div>
    );
  }

  // Handle extracted image placeholder IDs that couldn't be resolved
  if (isExtractedImageId(src)) {
    console.error('ImageRenderer: Unresolved extracted image ID:', src);
    return (
      <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
        <p>Image failed to load: Could not resolve large image</p>
        <p className="text-xs mt-1">Image ID: {src}</p>
        <p className="text-xs mt-1">Alt text: {alt || 'No alt text'}</p>
      </div>
    );
  }

  // Validate base64 data URI format
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

  // Convert large base64 images to blob URLs for better performance
  useEffect(() => {
    if (!src || !src.startsWith('data:image/')) return;

    // For large images (>1MB), convert to blob URL
    if (src.length > 1024 * 1024) {
      console.log('ImageRenderer: Converting large image to blob URL, size:', src.length);
      
      try {
        // Extract the base64 data
        const base64Data = src.split(',')[1];
        const mimeType = src.split(';')[0].split(':')[1];
        
        // Convert to binary
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        // Create blob and URL
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Clean up previous blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        
        blobUrlRef.current = url;
        setBlobUrl(url);
        console.log('ImageRenderer: Created blob URL successfully');
        
      } catch (error) {
        console.error('ImageRenderer: Error creating blob URL:', error);
        setImageError(true);
      }
    }

    // Cleanup function
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src]);

  console.log('ImageRenderer: Image validation passed, rendering img element');

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('ImageRenderer: Image onError event fired');
    console.error('ImageRenderer: Image failed to load in browser, src length:', src?.length);
    console.error('ImageRenderer: Using blob URL:', !!blobUrl);
    setImageError(true);
  }, [src, blobUrl]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('ImageRenderer: Image loaded successfully!');
    console.log('ImageRenderer: Loaded image dimensions:', {
      naturalWidth: e.currentTarget.naturalWidth,
      naturalHeight: e.currentTarget.naturalHeight
    });
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // Show error state if image failed to load
  if (imageError) {
    return (
      <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
        <p>Failed to load generated image</p>
        <p className="text-xs mt-1">Source length: {src?.length || 0}</p>
        <p className="text-xs">Alt: {alt || 'No alt text'}</p>
        <p className="text-xs">Preview: {src?.substring(0, 50) || 'No preview'}...</p>
        <p className="text-xs">Using blob URL: {blobUrl ? 'Yes' : 'No'}</p>
        <div className="mt-2">
          <button 
            onClick={() => {
              setImageError(false);
              setImageLoaded(false);
            }}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry Load
          </button>
        </div>
      </div>
    );
  }

  // Use blob URL for large images, original src for smaller ones
  const imageSrc = blobUrl || src;

  return (
    <div className="my-4 text-center">
      {!imageLoaded && (
        <div className="mb-2 text-sm text-muted-foreground">
          Loading image... ({Math.round((src?.length || 0) / 1024)}KB)
          {blobUrl && <span className="ml-2 text-xs">(Using optimized blob URL)</span>}
        </div>
      )}
      <img 
        src={imageSrc} 
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
