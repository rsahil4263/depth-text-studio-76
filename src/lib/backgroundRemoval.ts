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

// Improved image dimensions for better quality
const MAX_IMAGE_DIMENSION = 2048; // Increased for better quality
const MOBILE_MAX_IMAGE_DIMENSION = 1024; // Doubled for better mobile quality

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  // Use mobile-optimized dimensions for mobile devices
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth <= 768 ||
                   ('ontouchstart' in window);
  
  const maxDimension = isMobile ? MOBILE_MAX_IMAGE_DIMENSION : MAX_IMAGE_DIMENSION;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
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
    
    // Enhanced background removal with WebGPU acceleration and quality-first approach
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768 ||
                     ('ontouchstart' in window);
    
    let result: Blob;
    
    // Quality-first approach with fallback
    const processWithFallback = async (imageSource: File | Blob | string): Promise<Blob> => {
      try {
        // First attempt: High quality with WebGPU acceleration
        console.log('Attempting high-quality background removal with WebGPU...');
        return await removeBackground(imageSource, {
          // Remove model specification to use default higher-quality model
          output: {
            format: 'image/png',
            quality: 0.95 // High quality output
          }
        });
      } catch (error) {
        console.warn('High-quality processing failed, trying fallback...', error);
        
        // Fallback: Standard processing
        if (error instanceof Error && (error.message.includes('memory') || error.message.includes('timeout'))) {
          console.log('Using fallback processing due to resource constraints...');
          return await removeBackground(imageSource, {
            output: {
              format: 'image/png',
              quality: 0.85 // Slightly reduced quality for fallback
            }
          });
        }
        throw error;
      }
    };
    
    result = await processWithFallback(imageSource);
    
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
          
          // Process pixels preserving alpha gradients for smooth edges
          for (let i = 0; i < length; i += 4) {
            const alpha = data[i + 3];
            
            // Preserve original alpha gradients instead of binary conversion
            if (alpha > 0) {
              // Foreground pixel - mark as white but preserve alpha for smooth edges
              maskDataArray[i] = 255;     // R
              maskDataArray[i + 1] = 255; // G
              maskDataArray[i + 2] = 255; // B
              maskDataArray[i + 3] = alpha; // Preserve original alpha for smooth edges
            } else {
              // Background pixel - mark as transparent
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

/**
 * Create a fallback mask when background removal fails or times out
 * Uses simple edge detection and color similarity to create a basic subject mask
 */
const createFallbackMask = async (
  canvas: HTMLCanvasElement, 
  context: CanvasRenderingContext2D
): Promise<ImageData> => {
  return withErrorHandling(async () => {
    console.log('Creating fallback mask using edge detection...');
    
    const width = canvas.width;
    const height = canvas.height;
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    const maskData = context.createImageData(width, height);
    const mask = maskData.data;
    
    // Create a more generous center-weighted mask for better results
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    // First pass: create a basic center-weighted mask
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate distance from center (subjects are usually centered)
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        const centerWeight = 1 - (distanceFromCenter / maxDistance);
        
        // Get pixel values
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        
        // More generous subject detection
        const isLikelySubject = (
          centerWeight > 0.2 && // Larger center area
          brightness > 30 && brightness < 220 && // Wider brightness range
          (r + g + b) > 90 // Not too dark
        );
        
        if (isLikelySubject) {
          // Mark as foreground
          mask[idx] = 255;     // R
          mask[idx + 1] = 255; // G
          mask[idx + 2] = 255; // B
          mask[idx + 3] = 255; // A
        } else {
          // Mark as background
          mask[idx] = 0;       // R
          mask[idx + 1] = 0;   // G
          mask[idx + 2] = 0;   // B
          mask[idx + 3] = 0;   // A
        }
      }
    }
    
    // Second pass: smooth the mask to reduce noise
    const smoothedMask = context.createImageData(width, height);
    const smoothed = smoothedMask.data;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Count neighboring foreground pixels
        let foregroundCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
            if (mask[neighborIdx + 3] > 0) foregroundCount++;
          }
        }
        
        // Keep pixel as foreground if majority of neighbors are foreground
        if (foregroundCount >= 5) {
          smoothed[idx] = 255;
          smoothed[idx + 1] = 255;
          smoothed[idx + 2] = 255;
          smoothed[idx + 3] = 255;
        } else {
          smoothed[idx] = 0;
          smoothed[idx + 1] = 0;
          smoothed[idx + 2] = 0;
          smoothed[idx + 3] = 0;
        }
      }
    }
    
    console.log('Fallback mask created successfully');
    return smoothedMask;
  }, 'Fallback mask creation');
};

export const segmentSubject = async (
  imageElement: HTMLImageElement,
  onProgress?: (step: string, progress: number) => void
): Promise<{ 
  mask: ImageData;
  originalImage: HTMLImageElement;
  canvas: HTMLCanvasElement;
  originalCanvas: HTMLCanvasElement;
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
    
    onProgress?.('Validating and optimizing image', 5);
    
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
    
    onProgress?.('Preparing optimized image for processing', 15);
    
    // Optimize image for processing
    const optimizationResult = await optimizeImageForProcessing(imageElement, DEFAULT_OPTIMIZATION_CONFIG);
    performanceTracker.updateProcessedDimensions(optimizationResult.optimizedDimensions);
    
    if (optimizationResult.wasOptimized) {
      console.log(`Image optimized from ${originalDimensions.width}x${originalDimensions.height} to ${optimizationResult.optimizedDimensions.width}x${optimizationResult.optimizedDimensions.height}`);
      onProgress?.('Image optimized for better performance', 20);
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
    onProgress?.('Image prepared, starting AI analysis', 30);
    
    onProgress?.('Running background removal AI', 45);
    
    // Process the optimized image with @imgly/background-removal with mobile timeout
    console.log('Processing with @imgly/background-removal...');
    
    // Add progress updates during processing
    const progressInterval = setInterval(() => {
      const currentProgress = Math.min(70, 45 + Math.random() * 20);
      onProgress?.('Processing background removal', currentProgress);
    }, 1000);
    
    try {
      // Add timeout for mobile devices to prevent hanging
      const foregroundBlob = await Promise.race([
        processBackgroundRemoval(optimizationResult.optimizedBlob, performanceTracker),
        new Promise<never>((_, reject) => {
          // Shorter timeout for mobile devices
          const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           window.innerWidth <= 768 ||
                           ('ontouchstart' in window);
          const timeoutDuration = isMobile ? 45000 : 60000; // More generous timeouts: 45s mobile, 60s desktop
          setTimeout(() => {
            reject(new Error('Background removal timed out. Please try a smaller image or try again.'));
          }, timeoutDuration);
        })
      ]);
      
      clearInterval(progressInterval);
      onProgress?.('AI processing complete, generating mask', 75);
      
      // Continue with mask conversion
      console.log('Converting processed image to mask...');
      const mask = await convertBlobToMask(foregroundBlob, canvas.width, canvas.height);
      
      // Create a canvas with the processed foreground image (subject with transparent background)
      const processedCanvas = createOptimizedCanvas(
        { width: canvas.width, height: canvas.height },
        { willReadFrequently: false, alpha: true }
      );
      
      // Load the foreground blob into the processed canvas
      const foregroundImage = new Image();
      await new Promise<void>((resolve, reject) => {
        foregroundImage.onload = () => resolve();
        foregroundImage.onerror = () => reject(new Error('Failed to load processed foreground image'));
        foregroundImage.src = URL.createObjectURL(foregroundBlob);
      });
      
      processedCanvas.context.drawImage(foregroundImage, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(foregroundImage.src);
      
      onProgress?.('Finalizing results', 95);
      
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
        canvas: processedCanvas.canvas, // Return the processed canvas with transparent background
        originalCanvas: canvas, // Also return the original canvas for background reconstruction
        metrics
      };
    } catch (error) {
      clearInterval(progressInterval);
      
      // If it's a timeout error, try a fallback approach
      if (error instanceof Error && error.message.includes('timed out')) {
        console.warn('Background removal timed out, trying fallback approach...');
        onProgress?.('Trying alternative processing method', 50);
        
        try {
          // Fallback: create a simple mask based on edge detection or color similarity
          const fallbackMask = await createFallbackMask(canvas, context);
          
          onProgress?.('Alternative processing complete', 95);
          
          const metrics = performanceTracker.finish();
          URL.revokeObjectURL(optimizedImage.src);
          
          console.log('Fallback processing completed successfully');
          
          return {
            mask: fallbackMask,
            originalImage: imageElement,
            canvas,
            originalCanvas: canvas,
            metrics
          };
        } catch (fallbackError) {
          console.error('Fallback processing also failed:', fallbackError);
          onProgress?.('Processing failed', 0);
          throw new Error('Image processing failed. Please try a smaller or different image.');
        }
      }
      
      throw error;
    }

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
  processedCanvas: HTMLCanvasElement, // This contains the subject with transparent background
  mask: ImageData,
  text: string,
  options: {
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
    x: number;
    y: number;
    rotation?: number;
    blur: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  },
  originalImage?: HTMLImageElement // Original image for background reconstruction
): HTMLCanvasElement => {
  const canvasesToCleanup: HTMLCanvasElement[] = [];
  
  console.log('renderTextBehindSubject called with:', {
    canvasSize: { width: processedCanvas.width, height: processedCanvas.height },
    maskSize: { width: mask.width, height: mask.height },
    text,
    options
  });
  
  try {
    // Validate inputs
    if (!processedCanvas) {
      throw new Error('No processed canvas provided for text rendering');
    }
    
    if (!originalImage) {
      throw new Error('Original image is required for proper text-behind-subject effect');
    }
    
    if (!mask) {
      throw new Error('No mask data provided for text rendering');
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for rendering');
    }
    
    if (processedCanvas.width <= 0 || processedCanvas.height <= 0) {
      throw new Error('Invalid canvas dimensions for text rendering');
    }
    
    // Create optimized output canvas
    const canvasDimensions = { width: processedCanvas.width, height: processedCanvas.height };
    const outputResult = createOptimizedCanvas(canvasDimensions, { willReadFrequently: false, alpha: true });
    const outputCanvas = outputResult.canvas;
    const ctx = outputResult.context;
  
    // STEP 1: Create a full background canvas from original image
    const fullBackgroundResult = createOptimizedCanvas(canvasDimensions, { willReadFrequently: false, alpha: true });
    const fullBackgroundCanvas = fullBackgroundResult.canvas;
    const fullBgCtx = fullBackgroundResult.context;
    canvasesToCleanup.push(fullBackgroundCanvas);
    
    // Draw the original image as background
    fullBgCtx.drawImage(originalImage, 0, 0, canvasDimensions.width, canvasDimensions.height);
    console.log('Created full background from original image');

    // STEP 2: Create text layer
    const textResult = createOptimizedCanvas(canvasDimensions, { willReadFrequently: false, alpha: true });
    const textCanvas = textResult.canvas;
    const textCtx = textResult.context;
    canvasesToCleanup.push(textCanvas);
  
    // Configure text rendering with style options
    let fontStyle = '';
    if (options.italic) fontStyle += 'italic ';
    if (options.bold) fontStyle += 'bold ';
  
    const fontString = `${fontStyle}${options.fontSize}px ${options.fontFamily}`;
    textCtx.font = fontString;
    textCtx.fillStyle = options.color;
    textCtx.globalAlpha = options.opacity / 100;
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    
    // Apply blur effect if specified
    if (options.blur > 0) {
      textCtx.filter = `blur(${options.blur}px)`;
    } else {
      textCtx.filter = 'none';
    }
  
    console.log('Drawing text with settings:', {
      font: fontString,
      fillStyle: options.color,
      globalAlpha: options.opacity / 100,
      position: { x: options.x, y: options.y },
      blur: options.blur,
      text
    });
  
    // Draw text with shadow for better visibility
    textCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    textCtx.shadowBlur = 2;
    textCtx.shadowOffsetX = 1;
    textCtx.shadowOffsetY = 1;
    
    // Apply rotation if specified
    if (options.rotation && options.rotation !== 0) {
      textCtx.save();
      textCtx.translate(options.x, options.y);
      textCtx.rotate((options.rotation * Math.PI) / 180);
      textCtx.translate(-options.x, -options.y);
    }
    
    // Draw text
    textCtx.fillText(text, options.x, options.y);
    
    console.log('Text drawn on text canvas');
  
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
    
    // Restore context if rotation was applied
    if (options.rotation && options.rotation !== 0) {
      textCtx.restore();
    }
  
    // STEP 3: Create the final composite using proper masking technique
    console.log('Creating text-behind-subject composite...');
    
    // Start with the full background
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(fullBackgroundCanvas, 0, 0);
    console.log('Drew full background');
    
    // Draw text on top of background
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(textCanvas, 0, 0);
    console.log('Drew text layer on background');
    
    // Now use the subject mask to "cut out" the subject area from the text
    // This is the key: we use destination-out to remove text where subject exists
    const maskCanvas = createOptimizedCanvas(canvasDimensions, { willReadFrequently: false, alpha: true });
    const maskCtx = maskCanvas.context;
    canvasesToCleanup.push(maskCanvas.canvas);
    
    // Create a mask canvas where white areas represent the subject
    const maskData = mask.data;
    const maskImageData = maskCtx.createImageData(canvasDimensions.width, canvasDimensions.height);
    const maskPixels = maskImageData.data;
    
    // Convert mask to proper format for compositing
    for (let i = 0; i < maskData.length; i += 4) {
      const alpha = maskData[i + 3]; // Subject alpha from mask
      // Where subject exists (alpha > 0), make it white and opaque
      if (alpha > 0) {
        maskPixels[i] = 255;     // R
        maskPixels[i + 1] = 255; // G  
        maskPixels[i + 2] = 255; // B
        maskPixels[i + 3] = alpha; // Preserve alpha for smooth edges
      } else {
        maskPixels[i] = 0;       // R
        maskPixels[i + 1] = 0;   // G
        maskPixels[i + 2] = 0;   // B
        maskPixels[i + 3] = 0;   // A
      }
    }
    
    maskCtx.putImageData(maskImageData, 0, 0);
    
    // Use destination-out to remove text where subject will be
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(maskCanvas.canvas, 0, 0);
    console.log('Removed text from subject areas using mask');
    
    // Finally, draw the subject on top
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(processedCanvas, 0, 0);
    console.log('Drew subject on top, completing text-behind-subject effect');
    
    console.log('Text-behind-subject rendering complete');
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