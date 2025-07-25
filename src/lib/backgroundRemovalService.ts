import { removeBackground } from '@imgly/background-removal';

/**
 * Supported image source types for background removal
 */
export type ImageSource = File | Blob | string;

/**
 * Result of background removal processing
 */
export interface BackgroundRemovalResult {
  /** The processed image with transparent background */
  foregroundBlob: Blob;
  /** The original image element for reference */
  originalImage: HTMLImageElement;
}

/**
 * Configuration options for background removal processing
 */
export interface BackgroundRemovalOptions {
  /** Optional progress callback for processing updates */
  onProgress?: (progress: number) => void;
}

/**
 * Custom error class for background removal failures
 */
export class BackgroundRemovalError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'BackgroundRemovalError';
  }
}

/**
 * Background removal service interface
 */
export interface BackgroundRemovalService {
  /**
   * Process an image to remove its background
   * @param imageSource - File, Blob, or image URL to process
   * @param options - Optional configuration for processing
   * @returns Promise resolving to the processed result
   */
  processImage(imageSource: ImageSource, options?: BackgroundRemovalOptions): Promise<BackgroundRemovalResult>;
  
  /**
   * Load an image from a blob
   * @param file - Blob containing image data
   * @returns Promise resolving to HTMLImageElement
   */
  loadImage(file: Blob): Promise<HTMLImageElement>;
}

/**
 * Implementation of the background removal service using @imgly/background-removal
 */
export class ImglyBackgroundRemovalService implements BackgroundRemovalService {
  /**
   * Process an image to remove its background using @imgly/background-removal
   */
  async processImage(imageSource: ImageSource, options?: BackgroundRemovalOptions): Promise<BackgroundRemovalResult> {
    try {
      console.log('Starting background removal processing...');
      
      // Load the original image for reference
      let originalImage: HTMLImageElement;
      
      if (imageSource instanceof File || imageSource instanceof Blob) {
        originalImage = await this.loadImage(imageSource);
      } else if (typeof imageSource === 'string') {
        originalImage = await this.loadImageFromUrl(imageSource);
      } else {
        throw new BackgroundRemovalError('Invalid image source type');
      }
      
      // Process the image with @imgly/background-removal
      const foregroundBlob = await removeBackground(imageSource, {
        progress: options?.onProgress
      });
      
      console.log('Background removal completed successfully');
      
      return {
        foregroundBlob,
        originalImage
      };
      
    } catch (error) {
      console.error('Background removal failed:', error);
      
      // If it's already a BackgroundRemovalError, re-throw it
      if (error instanceof BackgroundRemovalError) {
        throw error;
      }
      
      // Wrap the error with user-friendly message
      const errorMessage = this.getErrorMessage(error);
      throw new BackgroundRemovalError(errorMessage, error as Error);
    }
  }
  
  /**
   * Load an image from a blob
   */
  async loadImage(file: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new BackgroundRemovalError('Failed to load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Load an image from a URL
   */
  private async loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new BackgroundRemovalError('Failed to load image from URL'));
      
      // Handle CORS for external URLs
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }
  
  /**
   * Convert various error types to user-friendly messages
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('WebAssembly')) {
        return 'Browser does not support required features. Please try a different browser.';
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Network error occurred. Please check your connection and try again.';
      }
      
      if (error.message.includes('memory') || error.message.includes('out of memory')) {
        return 'Image is too large to process. Please try a smaller image.';
      }
      
      if (error.message.includes('format') || error.message.includes('invalid')) {
        return 'Invalid image format. Please try a different image.';
      }
    }
    
    // Default user-friendly error message
    return 'Could not process image. Please try another one.';
  }
}

/**
 * Default instance of the background removal service
 */
export const backgroundRemovalService = new ImglyBackgroundRemovalService();

/**
 * Convenience function for removing background from an image
 * @param imageSource - File, Blob, or image URL to process
 * @param options - Optional configuration for processing
 * @returns Promise resolving to the processed result
 */
export const removeImageBackground = (
  imageSource: ImageSource, 
  options?: BackgroundRemovalOptions
): Promise<BackgroundRemovalResult> => {
  return backgroundRemovalService.processImage(imageSource, options);
};