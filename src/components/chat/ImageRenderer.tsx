
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
  const [blobError, setBlobError] = useState<string | null>(null);
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

    // For large images (>500KB), convert to blob URL
    if (src.length > 500 * 1024) {
      console.log('ImageRenderer: Converting large image to blob URL, size:', src.length);
      
      try {
        // Validate base64 format more thoroughly
        const parts = src.split(',');
        if (parts.length !== 2) {
          throw new Error('Invalid data URI format');
        }

        const header = parts[0];
        const base64Data = parts[1];
        
        // Extract MIME type
        const mimeMatch = header.match(/data:([^;]+)/);
        if (!mimeMatch) {
          throw new Error('Could not extract MIME type');
        }
        const mimeType = mimeMatch[1];
        
        // Validate base64 data
        if (!base64Data || base64Data.length === 0) {
          throw new Error('No base64 data found');
        }

        // Test if base64 is valid
        try {
          const testDecode = atob(base64Data.substring(0, 100)); // Test first 100 chars
        } catch (e) {
          throw new Error('Invalid base64 encoding');
        }
        
        // Convert to binary in chunks to avoid memory issues
        const chunkSize = 8192;
        const chunks = [];
        
        for (let i = 0; i < base64Data.length; i += chunkSize) {
          const chunk = base64Data.substring(i, i + chunkSize);
          const binaryChunk = atob(chunk);
          const byteNumbers = new Array(binaryChunk.length);
          
          for (let j = 0; j < binaryChunk.length; j++) {
            byteNumbers[j] = binaryChunk.charCodeAt(j);
          }
          
          chunks.push(new Uint8Array(byteNumbers));
        }
        
        // Create blob from chunks
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Clean up previous blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        
        blobUrlRef.current = url;
        setBlobUrl(url);
        setBlobError(null);
        console.log('ImageRenderer: Created blob URL successfully, blob size:', blob.size);
        
      } catch (error) {
        console.error('ImageRenderer: Error creating blob URL:', error);
        setBlobError(error.message);
        setBlobUrl(null);
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

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('ImageRenderer: Image onError event fired');
    console.error('ImageRenderer: Image failed to load in browser');
    console.error('ImageRenderer: Original src length:', src?.length);
    console.error('ImageRenderer: Using blob URL:', !!blobUrl);
    console.error('ImageRenderer: Blob error:', blobError);
    console.error('ImageRenderer: Image element src:', e.currentTarget.src?.substring(0, 100));
    setImageError(true);
  }, [src, blobUrl, blobError]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('ImageRenderer: Image loaded successfully!');
    console.log('ImageRenderer: Loaded image dimensions:', {
      naturalWidth: e.currentTarget.naturalWidth,
      naturalHeight: e.currentTarget.naturalHeight
    });
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // Show error state if blob creation failed
  if (blobError) {
    return (
      <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
        <p>Failed to process image data</p>
        <p className="text-xs mt-1">Blob creation error: {blobError}</p>
        <p className="text-xs">Source length: {src?.length || 0}</p>
        <p className="text-xs">Alt: {alt || 'No alt text'}</p>
        <div className="mt-2">
          <button 
            onClick={() => {
              setBlobError(null);
              setImageError(false);
              setImageLoaded(false);
            }}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry Process
          </button>
        </div>
      </div>
    );
  }

  // Show error state if image failed to load
  if (imageError) {
    return (
      <div className="border border-dashed border-red-300 rounded-lg p-4 my-4 text-center text-red-600">
        <p>Failed to load generated image</p>
        <p className="text-xs mt-1">Source length: {src?.length || 0}</p>
        <p className="text-xs">Alt: {alt || 'No alt text'}</p>
        <p className="text-xs">Preview: {src?.substring(0, 50) || 'No preview'}...</p>
        <p className="text-xs">Using blob URL: {blobUrl ? 'Yes' : 'No'}</p>
        <p className="text-xs">Blob error: {blobError || 'None'}</p>
        <div className="mt-2">
          <button 
            onClick={() => {
              setImageError(false);
              setImageLoaded(false);
              setBlobError(null);
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
