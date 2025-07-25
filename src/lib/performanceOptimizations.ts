/**
 * Performance optimization utilities for image processing
 * Handles image size validation, memory management, and performance tracking
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProcessingMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: {
    initial: number;
    peak: number;
    final: number;
  };
  imageSize: {
    original: ImageDimensions;
    processed: ImageDimensions;
  };
}

export interface OptimizationConfig {
  maxDimension: number;
  maxFileSize: number; // in bytes
  qualityThreshold: number; // 0-1 for JPEG compression
  memoryThreshold: number; // in MB
}

// Default optimization configuration
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  maxDimension: 1024,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  qualityThreshold: 0.85,
  memoryThreshold: 100 // 100MB
};

/**
 * Performance metrics tracker for monitoring processing performance
 */
export class PerformanceTracker {
  private metrics: ProcessingMetrics;
  private memoryCheckInterval?: NodeJS.Timeout;
  private peakMemory = 0;

  constructor(originalDimensions: ImageDimensions) {
    this.metrics = {
      startTime: performance.now(),
      imageSize: {
        original: originalDimensions,
        processed: originalDimensions
      }
    };
    
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring() {
    // Check memory usage every 100ms during processing
    this.memoryCheckInterval = setInterval(() => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const currentMemory = memInfo.usedJSHeapSize / (1024 * 1024); // Convert to MB
        this.peakMemory = Math.max(this.peakMemory, currentMemory);
      }
    }, 100);
  }

  updateProcessedDimensions(dimensions: ImageDimensions) {
    this.metrics.imageSize.processed = dimensions;
  }

  finish(): ProcessingMetrics {
    this.metrics.endTime = performance.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    // Capture final memory metrics if available
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.metrics.memoryUsage = {
        initial: memInfo.usedJSHeapSize / (1024 * 1024),
        peak: this.peakMemory,
        final: memInfo.usedJSHeapSize / (1024 * 1024)
      };
    }

    return this.metrics;
  }

  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }
}

/**
 * Validates image dimensions and file size against optimization thresholds
 */
export function validateImageSize(
  file: File | Blob, 
  dimensions: ImageDimensions,
  config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG
): { isValid: boolean; issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check file size
  if (file.size > config.maxFileSize) {
    issues.push(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum (${(config.maxFileSize / (1024 * 1024)).toFixed(1)}MB)`);
    recommendations.push('Consider compressing the image or using a smaller resolution');
  }

  // Check dimensions
  const maxDim = Math.max(dimensions.width, dimensions.height);
  if (maxDim > config.maxDimension) {
    issues.push(`Image dimension (${maxDim}px) exceeds maximum (${config.maxDimension}px)`);
    recommendations.push(`Image will be automatically resized to ${config.maxDimension}px maximum dimension`);
  }

  // Calculate estimated memory usage (rough approximation)
  const estimatedMemoryMB = (dimensions.width * dimensions.height * 4) / (1024 * 1024); // 4 bytes per pixel (RGBA)
  if (estimatedMemoryMB > config.memoryThreshold) {
    issues.push(`Estimated memory usage (${estimatedMemoryMB.toFixed(1)}MB) may exceed threshold (${config.memoryThreshold}MB)`);
    recommendations.push('Consider using a smaller image or the system may resize it automatically');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Optimizes image dimensions while maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  original: ImageDimensions,
  maxDimension: number = DEFAULT_OPTIMIZATION_CONFIG.maxDimension
): ImageDimensions {
  const { width, height } = original;
  
  // If image is already within limits, return original dimensions
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  // Calculate scaling factor to fit within max dimension
  const scaleFactor = maxDimension / Math.max(width, height);
  
  return {
    width: Math.round(width * scaleFactor),
    height: Math.round(height * scaleFactor)
  };
}

/**
 * Creates an optimized canvas with proper memory management
 */
export function createOptimizedCanvas(
  dimensions: ImageDimensions,
  options: {
    willReadFrequently?: boolean;
    alpha?: boolean;
  } = {}
): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  // Configure context for optimal performance
  const contextOptions: CanvasRenderingContext2DSettings = {
    alpha: options.alpha !== false, // Default to true unless explicitly false
    willReadFrequently: options.willReadFrequently || false,
    // Use hardware acceleration when available
    desynchronized: true
  };

  const context = canvas.getContext('2d', contextOptions);
  if (!context) {
    throw new Error('Failed to create canvas context for optimized processing');
  }

  // Set image smoothing for better quality when scaling
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  return { canvas, context };
}

/**
 * Optimizes an image by resizing and compressing if needed
 */
export async function optimizeImageForProcessing(
  imageElement: HTMLImageElement,
  config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG
): Promise<{
  optimizedBlob: Blob;
  originalDimensions: ImageDimensions;
  optimizedDimensions: ImageDimensions;
  wasOptimized: boolean;
}> {
  const originalDimensions: ImageDimensions = {
    width: imageElement.naturalWidth,
    height: imageElement.naturalHeight
  };

  const optimalDimensions = calculateOptimalDimensions(originalDimensions, config.maxDimension);
  const wasOptimized = optimalDimensions.width !== originalDimensions.width || 
                      optimalDimensions.height !== originalDimensions.height;

  // Create optimized canvas
  const { canvas, context } = createOptimizedCanvas(optimalDimensions, {
    willReadFrequently: false,
    alpha: true
  });

  // Draw image with optimal scaling
  context.drawImage(
    imageElement,
    0, 0, originalDimensions.width, originalDimensions.height,
    0, 0, optimalDimensions.width, optimalDimensions.height
  );

  // Convert to blob with appropriate compression
  const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create optimized image blob'));
        }
      },
      'image/png', // Use PNG to preserve transparency
      config.qualityThreshold
    );
  });

  return {
    optimizedBlob,
    originalDimensions,
    optimizedDimensions: optimalDimensions,
    wasOptimized
  };
}

/**
 * Memory-efficient canvas cleanup utility
 */
export function cleanupCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (context) {
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // Reset canvas dimensions to free memory
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Batch cleanup for multiple canvases
 */
export function cleanupCanvases(canvases: HTMLCanvasElement[]) {
  canvases.forEach(cleanupCanvas);
}

/**
 * Memory usage monitoring utility
 */
export function getMemoryUsage(): { used: number; total?: number; available?: number } | null {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory;
    return {
      used: memInfo.usedJSHeapSize / (1024 * 1024), // Convert to MB
      total: memInfo.totalJSHeapSize / (1024 * 1024),
      available: memInfo.jsHeapSizeLimit / (1024 * 1024)
    };
  }
  return null;
}

/**
 * Checks if the system has sufficient memory for processing
 */
export function checkMemoryAvailability(requiredMB: number): boolean {
  const memoryInfo = getMemoryUsage();
  if (!memoryInfo || !memoryInfo.available) {
    // If we can't check memory, assume it's available
    return true;
  }
  
  const availableMemory = memoryInfo.available - memoryInfo.used;
  return availableMemory >= requiredMB;
}