import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getExtractedImage, isExtractedImageId } from '@/utils/imagePreprocessor';

interface ImageRendererProps {
  src?: string;
  alt?: string;
  node?: any;
  [key: string]: any;
}

export function ImageRenderer(props: ImageRendererProps) {
  // ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL LOGIC OR EARLY RETURNS
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobError, setBlobError] = useState<string | null>(null);
  const [finalImageSrc, setFinalImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const blobUrlRef = useRef<string | null>(null);
  const processedRef = useRef<boolean>(false);
  
  console.log('ImageRenderer: All props received:', props);
  
  // Extract src from various possible prop locations
  let src = props.src || props.node?.properties?.src || props.node?.url;
  let alt = props.alt || props.node?.properties?.alt;
  
  // Check if this is a placeholder for an extracted large image - but only process once
  useEffect(() => {
    if (processedRef.current) return;
    
    if (src && isExtractedImageId(src)) {
      console.log('ImageRenderer: Detected extracted image placeholder:', src);
      const extractedImage = getExtractedImage(src);
      if (extractedImage) {
        src = extractedImage.src;
        alt = extractedImage.alt;
        console.log('ImageRenderer: Restored large image, size:', src.length);
        processedRef.current = true;
      } else {
        console.error('ImageRenderer: Could not find extracted image for ID:', src);
        setImageError(true);
        return;
      }
    }
    
    console.log('ImageRenderer: Processing image with src length:', src?.length || 0);

    // Convert large base64 images to blob URLs for better performance
    if (!src || !src.startsWith('data:image/')) {
      setFinalImageSrc(src);
      return;
    }

    // For large images (>500KB), convert to blob URL
    if (src.length > 500 * 1024) {
      console.log('ImageRenderer: Converting large image to blob URL, size:', src.length);
      setIsProcessing(true);
      
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

        // Convert to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create blob
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Clean up previous blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        
        blobUrlRef.current = url;
        setBlobUrl(url);
        setFinalImageSrc(url);
        setBlobError(null);
        setIsProcessing(false);
        console.log('ImageRenderer: Created blob URL successfully, blob size:', blob.size);
        
      } catch (error) {
        console.error('ImageRenderer: Error creating blob URL:', error);
        setBlobError(error.message);
        setBlobUrl(null);
        setFinalImageSrc(src); // Fallback to original src
        setIsProcessing(false);
      }
    } else {
      // For smaller images, use original src
      setFinalImageSrc(src);
    }
  }, [src]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('ImageRenderer: Image onError event fired');
    console.error('ImageRenderer: Image failed to load in browser');
    console.error('ImageRenderer: Final image src:', finalImageSrc?.substring(0, 100));
    console.error('ImageRenderer: Using blob URL:', !!blobUrl);
    console.error('ImageRenderer: Blob error:', blobError);
    setImageError(true);
  }, [finalImageSrc, blobUrl, blobError]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('ImageRenderer: Image loaded successfully!');
    console.log('ImageRenderer: Loaded image dimensions:', {
      naturalWidth: e.currentTarget.naturalWidth,
      naturalHeight: e.currentTarget.naturalHeight
    });
    setImageLoaded(true);
    setImageError(false);
  }, []);

  // NOW ALL CONDITIONAL LOGIC AND EARLY RETURNS CAN HAPPEN AFTER ALL HOOKS
  
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
              processedRef.current = false;
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
              processedRef.current = false;
            }}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry Load
          </button>
        </div>
      </div>
    );
  }

  // Wait for finalImageSrc to be set or show processing state
  if (!finalImageSrc || isProcessing) {
    return (
      <div className="my-4 text-center">
        <div className="mb-2 text-sm text-muted-foreground">
          {isProcessing ? 'Processing image...' : 'Loading image...'} ({Math.round((src?.length || 0) / 1024)}KB)
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 text-center">
      {!imageLoaded && (
        <div className="mb-2 text-sm text-muted-foreground">
          Loading image... ({Math.round((src?.length || 0) / 1024)}KB)
          {blobUrl && <span className="ml-2 text-xs">(Using optimized blob URL)</span>}
        </div>
      )}
      <img 
        src={finalImageSrc} 
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
