/**
 * Performance utilities for background removal and image processing
 * Provides image optimization, memory management, and performance monitoring
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: {
    initial: number;
    peak: number;
    final: number;
  };
  imageSize?: {
    original: { width: number; height: number; fileSize: number };
    optimized?: { width: number; height: number; fileSize: number };
  };
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private memoryObserver?: PerformanceObserver;

  constructor() {
    // Initialize memory monitoring if available
    if ('PerformanceObserver' in window && 'memory' in performance) {
      try {
        this.memoryObserver = new PerformanceObserver((list) => {
          // Memory monitoring callback - can be used for detailed analysis
        });
      } catch (error) {
        console.warn('Performance monitoring not fully supported:', error);
      }
    }
  }

  startTiming(operationId: string): void {
    const metrics: PerformanceMetrics = {
      startTime: performance.now(),
      memoryUsage: {
        initial: this.getMemoryUsage(),
        peak: this.getMemoryUsage(),
        final: 0
      }
    };
    this.metrics.set(operationId, metrics);
  }

  endTiming(operationId: string): PerformanceMetrics | null {
    const metrics = this.metrics.get(operationId);
    if (!metrics) return null;

    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    if (metrics.memoryUsage) {
      metrics.memoryUsage.final = this.getMemoryUsage();
    }

    return metrics;
  }

  updateMemoryPeak(operationId: string): void {
    const metrics = this.metrics.get(operationId);
    if (metrics && metrics.memoryUsage) {
      const currentMemory = this.getMemoryUsage();
      if (currentMemory > metrics.memoryUsage.peak) {
        metrics.memoryUsage.peak = currentMemory;
      }
    }
  }

  getMetrics(operationId: string): PerformanceMetrics | null {
    return this.metrics.get(operationId) || null;
  }

  clearMetrics(operationId: string): void {
    this.metrics.delete(operationId);
  }

  private getMemoryUsage(): number {
    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize || 0;
    }
    return 0;
  }
}

/**
 * Validates image size and provides optimization recommendations
 */
export function validateImageSize(
  width: number, 
  height: number, 
  fileSize: number
): {
  isValid: boolean;
  needsOptimization: boolean;
  recommendations: string[];
  maxDimensions: { width: number; height: number };
} {
  const MAX_DIMENSION = 2048; // Maximum dimension for processing
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const OPTIMAL_DIMENSION = 1024; // Optimal dimension for performance

  const recommendations: string[] = [];
  let needsOptimization = false;

  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      isValid: false,
      needsOptimization: true,
      recommendations: ['Image file is too large (>10MB). Please use a smaller image.'],
      maxDimensions: { width: MAX_DIMENSION, height: MAX_DIMENSION }
    };
  }

  // Check dimensions
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return {
      isValid: false,
      needsOptimization: true,
      recommendations: [`Image dimensions are too large (${width}x${height}). Maximum supported: ${MAX_DIMENSION}x${MAX_DIMENSION}`],
      maxDimensions: { width: MAX_DIMENSION, height: MAX_DIMENSION }
    };
  }

  // Check if optimization would be beneficial
  if (width > OPTIMAL_DIMENSION || height > OPTIMAL_DIMENSION) {
    needsOptimization = true;
    recommendations.push(`Image will be resized to ${OPTIMAL_DIMENSION}px for optimal performance`);
  }

  if (fileSize > 5 * 1024 * 1024) { // 5MB
    needsOptimization = true;
    recommendations.push('Large image detected - processing may take longer');
  }

  return {
    isValid: true,
    needsOptimization,
    recommendations,
    maxDimensions: { width: OPTIMAL_DIMENSION, height: OPTIMAL_DIMENSION }
  };
}

/**
 * Optimizes image before processing to improve performance
 */
export async function optimizeImageForProcessing(
  imageElement: HTMLImageElement,
  options: ImageOptimizationOptions = {}
): Promise<{
  optimizedImage: HTMLImageElement;
  canvas: HTMLCanvasElement;
  wasOptimized: boolean;
  originalSize: { width: number; height: number };
  optimizedSize: { width: number; height: number };
}> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.9,
    format = 'png'
  } = options;

  const originalWidth = imageElement.naturalWidth;
  const originalHeight = imageElement.naturalHeight;

  // Calculate optimal dimensions while maintaining aspect ratio
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;
  let wasOptimized = false;

  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    const aspectRatio = originalWidth / originalHeight;
    
    if (originalWidth > originalHeight) {
      targetWidth = Math.min(maxWidth, originalWidth);
      targetHeight = Math.round(targetWidth / aspectRatio);
    } else {
      targetHeight = Math.min(maxHeight, originalHeight);
      targetWidth = Math.round(targetHeight * aspectRatio);
    }
    
    wasOptimized = true;
  }

  // Create optimized canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context for image optimization');
  }

  // Use high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw optimized image
  ctx.drawImage(imageElement, 0, 0, targetWidth, targetHeight);

  // Create optimized image element
  const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create optimized image blob'));
      }
    }, `image/${format}`, quality);
  });

  const optimizedImage = new Image();
  await new Promise<void>((resolve, reject) => {
    optimizedImage.onload = () => resolve();
    optimizedImage.onerror = () => reject(new Error('Failed to load optimized image'));
    optimizedImage.src = URL.createObjectURL(optimizedBlob);
  });

  return {
    optimizedImage,
    canvas,
    wasOptimized,
    originalSize: { width: originalWidth, height: originalHeight },
    optimizedSize: { width: targetWidth, height: targetHeight }
  };
}

/**
 * Memory-efficient canvas operations utility
 */
export class CanvasMemoryManager {
  private canvasPool: HTMLCanvasElement[] = [];
  private maxPoolSize = 5;

  /**
   * Get a canvas from the pool or create a new one
   */
  getCanvas(width: number, height: number): HTMLCanvasElement {
    let canvas = this.canvasPool.pop();
    
    if (!canvas) {
      canvas = document.createElement('canvas');
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear the canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
    }
    
    return canvas;
  }

  /**
   * Return a canvas to the pool for reuse
   */
  releaseCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvasPool.length < this.maxPoolSize) {
      // Clear the canvas before returning to pool
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      this.canvasPool.push(canvas);
    }
  }

  /**
   * Clear the canvas pool and free memory
   */
  clearPool(): void {
    this.canvasPool = [];
  }

  /**
   * Force garbage collection hint (if available)
   */
  forceGarbageCollection(): void {
    // Trigger garbage collection hint if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch (error) {
        // Ignore errors - gc() is not always available
      }
    }
  }
}

// Global instances
export const performanceMonitor = new PerformanceMonitor();
export const canvasMemoryManager = new CanvasMemoryManager();

/**
 * Utility to estimate memory usage for image processing
 */
export function estimateMemoryUsage(width: number, height: number): {
  imageData: number;
  canvas: number;
  total: number;
  recommendation: string;
} {
  // Each pixel uses 4 bytes (RGBA)
  const pixelCount = width * height;
  const imageDataSize = pixelCount * 4;
  
  // Canvas typically uses additional memory for rendering
  const canvasOverhead = imageDataSize * 0.5; // Estimated 50% overhead
  
  const total = imageDataSize + canvasOverhead;
  
  let recommendation = 'Memory usage is optimal';
  if (total > 50 * 1024 * 1024) { // 50MB
    recommendation = 'High memory usage - consider reducing image size';
  } else if (total > 20 * 1024 * 1024) { // 20MB
    recommendation = 'Moderate memory usage - monitor performance on mobile devices';
  }

  return {
    imageData: imageDataSize,
    canvas: canvasOverhead,
    total,
    recommendation
  };
}