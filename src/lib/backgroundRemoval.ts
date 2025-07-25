import { removeBackground } from '@imgly/background-removal';
import { 
  handleBackgroundRemovalError, 
  withErrorHandling, 
  validateBrowserCompatibility,
  BackgroundRemovalErrorType 
} from './errorHandling';
import {
  PerformanceTracker,
  validateImageSize,
  optimizeImageForProcessing,
  createOptimizedCanvas,
  cleanupCanvas,
  checkMemoryAvailability,
  getMemoryUsage,
  DEFAULT_OPTIMIZATION_CONFIG,
  type ProcessingMetrics,
  type ImageDimensions
} from './performanceOptimizations';

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

/**
 * Remove background from image using @imgly/background-removal library with performance optimizations
 * @param imageSource - File, Blob, or image URL
 * @param performanceTracker - Optional performance tracker for metrics
 * @returns Promise<Blob> - Image blob with transparent background
 */
const processBackgroundRemoval = async (
  imageSource: File | Blob | string,
  performanceTracker?: PerformanceTracker
): Promise<Blob> => {
  return withErrorHandling(async () => {
    console.log('Starting optimized background removal with @imgly/background-removal...');
    
    // Validate browser compatibility before processing
    validateBrowserCompatibility();
    
    // Validate input
    if (!imageSource) {
      throw new Error('No image source provided');
    }
    
    // Enhanced validation for File/Blob inputs with performance considerations
    if (imageSource instanceof File || imageSource instanceof Blob) {
      if (!imageSource.type.startsWith('image/')) {
        throw new Error('Invalid image format. Please use PNG, JPG, or JPEG.');
      }
      
      // Use optimized file size validation
      const validation = validateImageSize(
        imageSource, 
        { width: 0, height: 0 }, // Will be updated after image load
        DEFAULT_OPTIMIZATION_CONFIG
      );
      
      if (!validation.isValid) {
        const errorMessage = `Image validation failed: ${validation.issues.join(', ')}`;
        console.warn(errorMessage);
        console.log('Recommendations:', validation.recommendations);
        
        // Still proceed but log the issues for monitoring
        if (imageSource.size > DEFAULT_OPTIMIZATION_CONFIG.maxFileSize) {
          throw new Error('Image file is too large. Please use an image smaller than 10MB.');
        }
      }
      
      // Check memory availability before processing
      const estimatedMemoryMB = imageSource.size / (1024 * 1024) * 4; // Rough estimate
      if (!checkMemoryAvailability(estimatedMemoryMB)) {
        throw new Error('Insufficient memory available for processing this image. Please try a smaller image.');
      }
    }
    
    // Log memory usage before processing
    const memoryBefore = getMemoryUsage();
    if (memoryBefore) {
      console.log(`Memory before processing: ${memoryBefore.used.toFixed(1)}MB used of ${memoryBefore.available?.toFixed(1)}MB available`);
    }
    
    const result = await removeBackground(imageSource);
    
    // Log memory usage after processing
    const memoryAfter = getMemoryUsage();
    if (memoryAfter && memoryBefore) {
      const memoryDiff = memoryAfter.used - memoryBefore.used;
      console.log(`Memory after processing: ${memoryAfter.used.toFixed(1)}MB used (${memoryDiff > 0 ? '+' : ''}${memoryDiff.toFixed(1)}MB change)`);
    }
    
    console.log('Background removal completed successfully');
    return result;
  }, 'Background removal processing');
};

/**
 * Convert foreground-only image blob to ImageData mask for compatibility with memory optimization
 * @param foregroundBlob - Blob containing image with transparent background
 * @param originalWidth - Width of original image
 * @param originalHeight - Height of original image
 * @returns Promise<ImageData> - Mask data where alpha channel indicates foreground
 */
const convertBlobToMask = async (foregroundBlob: Blob, originalWidth: number, originalHeight: number): Promise<ImageData> => {
  return withErrorHandling(async () => {
    return new Promise<ImageData>((resolve, reject) => {
      const img = new Image();
      let objectUrl: string | null = null;
      let canvas: HTMLCanvasElement | null = null;
      
      img.onload = () => {
        try {
          // Use optimized canvas creation
          const canvasResult = createOptimizedCanvas(
            { width: originalWidth, height: originalHeight },
            { willReadFrequently: true, alpha: true }
          );
          canvas = canvasResult.canvas;
          const ctx = canvasResult.context;
          
          // Draw the foreground image
          ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
          
          // Get image data and create mask from alpha channel
          const imageData = ctx.getImageData(0, 0, originalWidth, originalHeight);
          const maskData = ctx.createImageData(originalWidth, originalHeight);
          
          // Optimized alpha channel to mask conversion with batch processing
          const data = imageData.data;
          const maskDataArray = maskData.data;
          const length = data.length;
          
          // Process pixels in batches for better performance
          for (let i = 0; i < length; i += 4) {
            const alpha = data[i + 3];
            
            if (alpha > 0) {
              // Foreground pixel - mark as white in mask
              maskDataArray[i] = 255;     // R
              maskDataArray[i + 1] = 255; // G
              maskDataArray[i + 2] = 255; // B
              maskDataArray[i + 3] = 255; // A
            } else {
              // Background pixel - mark as transparent in mask
              maskDataArray[i] = 0;       // R
              maskDataArray[i + 1] = 0;   // G
              maskDataArray[i + 2] = 0;   // B
              maskDataArray[i + 3] = 0;   // A
            }
          }
          
          resolve(maskData);
        } catch (error) {
          reject(error);
        } finally {
          // Clean up resources
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          if (canvas) {
            cleanupCanvas(canvas);
          }
        }
      };
      
      img.onerror = (event) => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        if (canvas) {
          cleanupCanvas(canvas);
        }
        reject(new Error('Failed to load processed image for mask conversion'));
      };
      
      try {
        objectUrl = URL.createObjectURL(foregroundBlob);
        img.src = objectUrl;
      } catch (error) {
        reject(new Error('Failed to create object URL for processed image'));
      }
    });
  }, 'Mask conversion from processed image');
};

export const segmentSubject = async (
  imageElement: HTMLImageElement,
  onProgress?: (step: string, progress: number) => void
): Promise<{ 
  mask: ImageData;
  originalImage: HTMLImageElement;
  canvas: HTMLCanvasElement;
  metrics?: ProcessingMetrics;
}> => {
  return withErrorHandling(async () => {
    console.log('Starting optimized subject segmentation with @imgly/background-removal...');
    
    // Initialize performance tracking
    const originalDimensions: ImageDimensions = {
      width: imageElement.naturalWidth,
      height: imageElement.naturalHeight
    };
    const performanceTracker = new PerformanceTracker(originalDimensions);
    
    onProgress?.('Validating and optimizing image...', 5);
    
    // Validate input
    if (!imageElement) {
      throw new Error('No image element provided for segmentation');
    }
    
    if (!imageElement.complete || imageElement.naturalWidth === 0) {
      throw new Error('Image element is not fully loaded');
    }
    
    // Perform image size validation and optimization
    console.log(`Original image dimensions: ${originalDimensions.width}x${originalDimensions.height}`);
    
    // Check memory availability for processing
    const estimatedMemoryMB = (originalDimensions.width * originalDimensions.height * 4) / (1024 * 1024);
    if (!checkMemoryAvailability(estimatedMemoryMB * 2)) { // 2x for processing overhead
      console.warn(`Estimated memory usage: ${estimatedMemoryMB.toFixed(1)}MB may be high for current system`);
    }
    
    onProgress?.('Preparing optimized image for processing...', 15);
    
    // Optimize image for processing
    const optimizationResult = await optimizeImageForProcessing(imageElement, DEFAULT_OPTIMIZATION_CONFIG);
    performanceTracker.updateProcessedDimensions(optimizationResult.optimizedDimensions);
    
    if (optimizationResult.wasOptimized) {
      console.log(`Image optimized from ${originalDimensions.width}x${originalDimensions.height} to ${optimizationResult.optimizedDimensions.width}x${optimizationResult.optimizedDimensions.height}`);
      onProgress?.('Image optimized for better performance...', 20);
    }
    
    // Create optimized canvas for processing
    const { canvas, context } = createOptimizedCanvas(
      optimizationResult.optimizedDimensions,
      { willReadFrequently: false, alpha: true }
    );
    
    // Load optimized image into canvas
    const optimizedImage = new Image();
    await new Promise<void>((resolve, reject) => {
      optimizedImage.onload = () => resolve();
      optimizedImage.onerror = () => reject(new Error('Failed to load optimized image'));
      optimizedImage.src = URL.createObjectURL(optimizationResult.optimizedBlob);
    });
    
    context.drawImage(optimizedImage, 0, 0);
    
    console.log(`Processing canvas dimensions: ${canvas.width}x${canvas.height}`);
    onProgress?.('Image prepared, starting AI analysis...', 30);
    
    onProgress?.('Running background removal AI...', 45);
    
    // Process the optimized image with @imgly/background-removal
    console.log('Processing with @imgly/background-removal...');
    const foregroundBlob = await processBackgroundRemoval(optimizationResult.optimizedBlob, performanceTracker);
    
    onProgress?.('AI processing complete, generating mask...', 75);
    
    // Convert the foreground blob to a mask for compatibility with existing rendering pipeline
    console.log('Converting processed image to mask...');
    const mask = await convertBlobToMask(foregroundBlob, canvas.width, canvas.height);
    
    onProgress?.('Finalizing results...', 95);
    
    // Finish performance tracking
    const metrics = performanceTracker.finish();
    
    // Log performance metrics
    console.log('Subject segmentation completed successfully');
    console.log(`Processing time: ${metrics.duration?.toFixed(1)}ms`);
    if (metrics.memoryUsage) {
      console.log(`Memory usage - Initial: ${metrics.memoryUsage.initial.toFixed(1)}MB, Peak: ${metrics.memoryUsage.peak.toFixed(1)}MB, Final: ${metrics.memoryUsage.final.toFixed(1)}MB`);
    }
    console.log(`Image size - Original: ${metrics.imageSize.original.width}x${metrics.imageSize.original.height}, Processed: ${metrics.imageSize.processed.width}x${metrics.imageSize.processed.height}`);
    
    // Clean up temporary resources
    URL.revokeObjectURL(optimizedImage.src);
    
    return {
      mask,
      originalImage: imageElement,
      canvas,
      metrics
    };
  }, 'Subject segmentation');
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return withErrorHandling(async () => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      // Validate input
      if (!file) {
        reject(new Error('No file provided for image loading'));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        reject(new Error('Invalid file type. Please provide an image file.'));
        return;
      }
      
      // Perform size validation before loading
      const tempDimensions = { width: 0, height: 0 }; // Will be updated after load
      const validation = validateImageSize(file, tempDimensions, DEFAULT_OPTIMIZATION_CONFIG);
      
      if (!validation.isValid) {
        console.warn('Image validation issues:', validation.issues);
        console.log('Recommendations:', validation.recommendations);
        
        // Reject if file is too large
        if (file.size > DEFAULT_OPTIMIZATION_CONFIG.maxFileSize) {
          reject(new Error('Image file is too large. Please use an image smaller than 10MB.'));
          return;
        }
      }
      
      const img = new Image();
      let objectUrl: string | null = null;
      
      img.onload = () => {
        try {
          // Validate loaded image dimensions
          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            reject(new Error('Invalid image: image has no dimensions'));
            return;
          }
          
          // Update validation with actual dimensions
          const actualDimensions = { width: img.naturalWidth, height: img.naturalHeight };
          const finalValidation = validateImageSize(file, actualDimensions, DEFAULT_OPTIMIZATION_CONFIG);
          
          if (!finalValidation.isValid) {
            console.log(`Loaded image dimensions: ${actualDimensions.width}x${actualDimensions.height}`);
            console.log('Final validation issues:', finalValidation.issues);
            console.log('Recommendations:', finalValidation.recommendations);
          }
          
          // Check memory availability for the loaded image
          const estimatedMemoryMB = (actualDimensions.width * actualDimensions.height * 4) / (1024 * 1024);
          if (!checkMemoryAvailability(estimatedMemoryMB)) {
            console.warn(`Image may require ${estimatedMemoryMB.toFixed(1)}MB memory which may be high for current system`);
          }
          
          resolve(img);
          // Note: Don't revoke URL here as the image element still needs it
        } catch (error) {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };
      
      img.onerror = (event) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image file. The file may be corrupted or in an unsupported format.'));
      };
      
      try {
        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      } catch (error) {
        reject(new Error('Failed to create object URL for image file'));
      }
    });
  }, 'Image loading');
};

export const renderTextBehindSubject = (
  originalCanvas: HTMLCanvasElement,
  mask: ImageData,
  text: string,
  options: {
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
    x: number;
    y: number;
    blur: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  }
): HTMLCanvasElement => {
  const canvasesToCleanup: HTMLCanvasElement[] = [];
  
  try {
    // Validate inputs
    if (!originalCanvas) {
      throw new Error('No original canvas provided for text rendering');
    }
    
    if (!mask) {
      throw new Error('No mask data provided for text rendering');
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for rendering');
    }
    
    if (originalCanvas.width <= 0 || originalCanvas.height <= 0) {
      throw new Error('Invalid canvas dimensions for text rendering');
    }
    
    // Create optimized output canvas
    const canvasDimensions = { width: originalCanvas.width, height: originalCanvas.height };
    const outputResult = createOptimizedCanvas(canvasDimensions, { willReadFrequently: false, alpha: true });
    const outputCanvas = outputResult.canvas;
    const ctx = outputResult.context;
  
    // Step 1: Create optimized background layer (original image with inverted mask)
    const backgroundResult = createOptimizedCanvas(canvasDimensions, { willReadFrequently: true, alpha: true });
    const backgroundCanvas = backgroundResult.canvas;
    const bgCtx = backgroundResult.context;
    canvasesToCleanup.push(backgroundCanvas);
  
    bgCtx.drawImage(originalCanvas, 0, 0);
  
    // Apply inverted mask to get background only (remove subject) - optimized processing
    const backgroundImageData = bgCtx.getImageData(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    const backgroundData = backgroundImageData.data;
    const maskData = mask.data;
    const length = maskData.length;
    
    // Optimized mask application with batch processing
    for (let i = 0; i < length; i += 4) {
      const subjectAlpha = maskData[i + 3] / 255;
      // Invert the mask: where subject exists (high alpha), make background transparent
      backgroundData[i + 3] = backgroundData[i + 3] * (1 - subjectAlpha);
    }
    bgCtx.putImageData(backgroundImageData, 0, 0);
  
    // Step 2: Create optimized text layer
    const textResult = createOptimizedCanvas(canvasDimensions, { willReadFrequently: false, alpha: true });
    const textCanvas = textResult.canvas;
    const textCtx = textResult.context;
    canvasesToCleanup.push(textCanvas);
  
    // Configure text rendering with style options
    let fontStyle = '';
    if (options.italic) fontStyle += 'italic ';
    if (options.bold) fontStyle += 'bold ';
  
    textCtx.font = `${fontStyle}${options.fontSize}px ${options.fontFamily}`;
    textCtx.fillStyle = options.color;
    textCtx.globalAlpha = options.opacity / 100;
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    textCtx.filter = `blur(${options.blur}px)`;
  
    // Draw text
    textCtx.fillText(text, options.x, options.y);
  
    // Add underline if needed
    if (options.underline) {
      const textMetrics = textCtx.measureText(text);
      const textWidth = textMetrics.width;
      const underlineY = options.y + options.fontSize * 0.1;
    
      textCtx.strokeStyle = options.color;
      textCtx.lineWidth = Math.max(1, options.fontSize * 0.05);
      textCtx.beginPath();
      textCtx.moveTo(options.x - textWidth / 2, underlineY);
      textCtx.lineTo(options.x + textWidth / 2, underlineY);
      textCtx.stroke();
    }
  
    // Step 3: Create optimized subject layer (original image with mask)
    const subjectResult = createOptimizedCanvas(canvasDimensions, { willReadFrequently: true, alpha: true });
    const subjectCanvas = subjectResult.canvas;
    const subjectCtx = subjectResult.context;
    canvasesToCleanup.push(subjectCanvas);
  
    subjectCtx.drawImage(originalCanvas, 0, 0);
  
    // Apply mask to get subject only - optimized processing
    const subjectImageData = subjectCtx.getImageData(0, 0, subjectCanvas.width, subjectCanvas.height);
    const subjectData = subjectImageData.data;
    
    // Optimized mask application
    for (let i = 0; i < length; i += 4) {
      const subjectAlpha = maskData[i + 3] / 255;
      subjectData[i + 3] = subjectData[i + 3] * subjectAlpha;
    }
    subjectCtx.putImageData(subjectImageData, 0, 0);
  
    // Step 4: Composite final image with proper layering and optimized operations
    // Layer 1: Background (bottom)
    ctx.drawImage(backgroundCanvas, 0, 0);
    
    // Layer 2: Text (middle) - only draw where there's no subject
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(textCanvas, 0, 0);
    
    // Layer 3: Subject (top)
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(subjectCanvas, 0, 0);
    
    return outputCanvas;
  } catch (error) {
    const handledError = handleBackgroundRemovalError(
      error instanceof Error ? error : new Error(String(error)),
      'Text rendering behind subject'
    );
    throw handledError;
  } finally {
    // Clean up temporary canvases to free memory
    canvasesToCleanup.forEach(cleanupCanvas);
  }
};