/**
 * Mobile-specific performance optimizations for image processing
 * Handles mobile device constraints, battery optimization, and touch interactions
 */

import { 
  ImageDimensions, 
  OptimizationConfig, 
  PerformanceTracker,
  createOptimizedCanvas,
  cleanupCanvas,
  getMemoryUsage
} from './performanceOptimizations';

// Mobile-specific optimization configuration
export const MOBILE_OPTIMIZATION_CONFIG: OptimizationConfig = {
  maxDimension: 512, // Much smaller max dimension for mobile to prevent hanging
  maxFileSize: 3 * 1024 * 1024, // 3MB max for mobile for faster processing
  qualityThreshold: 0.75, // Lower quality for better performance
  memoryThreshold: 40 // 40MB threshold for mobile devices
};

// Mobile device detection and capabilities
export interface MobileCapabilities {
  isMobile: boolean;
  isLowEndDevice: boolean;
  hasHardwareAcceleration: boolean;
  maxTextureSize: number;
  devicePixelRatio: number;
  estimatedRAM: number; // in MB
  batteryLevel?: number;
  isCharging?: boolean;
}

/**
 * Detects mobile device capabilities and performance characteristics
 */
export function detectMobileCapabilities(): MobileCapabilities {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth <= 768 ||
                   ('ontouchstart' in window) ||
                   (navigator.maxTouchPoints > 0);
  
  // Estimate device performance based on various factors
  const devicePixelRatio = window.devicePixelRatio || 1;
  const screenPixels = window.screen.width * window.screen.height * devicePixelRatio;
  
  // Rough estimation of device performance
  const isLowEndDevice = screenPixels < 1000000 || // Less than ~1MP screen
                        devicePixelRatio < 2 || // Low DPI
                        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2); // Few CPU cores
  
  // Check for hardware acceleration support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const hasHardwareAcceleration = !!gl;
  
  // Get max texture size for WebGL (affects canvas performance)
  let maxTextureSize = 2048; // Conservative default
  if (gl) {
    maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }
  
  // Estimate RAM based on device characteristics
  let estimatedRAM = 2048; // Default 2GB
  if (navigator.deviceMemory) {
    estimatedRAM = navigator.deviceMemory * 1024; // Convert GB to MB
  } else if (isLowEndDevice) {
    estimatedRAM = 1024; // Assume 1GB for low-end devices
  } else if (devicePixelRatio >= 3) {
    estimatedRAM = 4096; // Assume 4GB for high-end devices
  }
  
  // Battery API support (experimental)
  let batteryLevel: number | undefined;
  let isCharging: boolean | undefined;
  
  if ('getBattery' in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      batteryLevel = battery.level * 100;
      isCharging = battery.charging;
    }).catch(() => {
      // Battery API not supported or blocked
    });
  }
  
  return {
    isMobile,
    isLowEndDevice,
    hasHardwareAcceleration,
    maxTextureSize,
    devicePixelRatio,
    estimatedRAM,
    batteryLevel,
    isCharging
  };
}

/**
 * Mobile-optimized configuration based on device capabilities
 */
export function getMobileOptimizedConfig(capabilities: MobileCapabilities): OptimizationConfig {
  const baseConfig = { ...MOBILE_OPTIMIZATION_CONFIG };
  
  if (capabilities.isLowEndDevice) {
    // More aggressive optimization for low-end devices
    baseConfig.maxDimension = 384; // Even smaller for low-end devices
    baseConfig.maxFileSize = 2 * 1024 * 1024; // 2MB
    baseConfig.qualityThreshold = 0.7;
    baseConfig.memoryThreshold = 25; // 25MB
  } else if (capabilities.estimatedRAM >= 4096) {
    // Less aggressive for high-end mobile devices
    baseConfig.maxDimension = 768;
    baseConfig.maxFileSize = 5 * 1024 * 1024; // 5MB
    baseConfig.qualityThreshold = 0.8;
    baseConfig.memoryThreshold = 60; // 60MB
  }
  
  // Adjust based on battery level
  if (capabilities.batteryLevel && capabilities.batteryLevel < 20 && !capabilities.isCharging) {
    // Battery saving mode - more aggressive optimization
    baseConfig.maxDimension = Math.min(baseConfig.maxDimension, 512);
    baseConfig.qualityThreshold = Math.min(baseConfig.qualityThreshold, 0.7);
  }
  
  return baseConfig;
}

/**
 * Touch-optimized debouncing for real-time updates
 */
export class TouchOptimizedDebouncer {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private lastValues: Map<string, any> = new Map();
  private capabilities: MobileCapabilities;
  
  constructor(capabilities: MobileCapabilities) {
    this.capabilities = capabilities;
  }
  
  /**
   * Debounce function calls with mobile-optimized timing
   */
  debounce<T extends (...args: any[]) => void>(
    key: string,
    fn: T,
    delay?: number
  ): (...args: Parameters<T>) => void {
    // Adaptive delay based on device performance
    const adaptiveDelay = delay || this.getOptimalDelay();
    
    return (...args: Parameters<T>) => {
      // Clear existing timeout
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // Set new timeout with adaptive delay
      const timeout = setTimeout(() => {
        fn(...args);
        this.timeouts.delete(key);
      }, adaptiveDelay);
      
      this.timeouts.set(key, timeout);
    };
  }
  
  /**
   * Throttle function calls for continuous updates (like sliders)
   */
  throttle<T extends (...args: any[]) => void>(
    key: string,
    fn: T,
    interval?: number
  ): (...args: Parameters<T>) => void {
    const adaptiveInterval = interval || this.getOptimalThrottleInterval();
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= adaptiveInterval) {
        lastCall = now;
        fn(...args);
      }
    };
  }
  
  /**
   * Smart debouncing that considers value changes
   */
  smartDebounce<T extends (...args: any[]) => void>(
    key: string,
    fn: T,
    getValue: () => any,
    delay?: number
  ): (...args: Parameters<T>) => void {
    const adaptiveDelay = delay || this.getOptimalDelay();
    
    return (...args: Parameters<T>) => {
      const currentValue = getValue();
      const lastValue = this.lastValues.get(key);
      
      // If value hasn't changed significantly, skip the update
      if (this.valuesAreSimilar(lastValue, currentValue)) {
        return;
      }
      
      this.lastValues.set(key, currentValue);
      
      // Clear existing timeout
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        fn(...args);
        this.timeouts.delete(key);
      }, adaptiveDelay);
      
      this.timeouts.set(key, timeout);
    };
  }
  
  private getOptimalDelay(): number {
    if (this.capabilities.isLowEndDevice) {
      return 300; // Longer delay for low-end devices
    } else if (this.capabilities.estimatedRAM >= 4096) {
      return 100; // Shorter delay for high-end devices
    }
    return 200; // Default delay
  }
  
  private getOptimalThrottleInterval(): number {
    if (this.capabilities.isLowEndDevice) {
      return 100; // 10 FPS for low-end devices
    } else if (this.capabilities.estimatedRAM >= 4096) {
      return 33; // ~30 FPS for high-end devices
    }
    return 50; // ~20 FPS default
  }
  
  private valuesAreSimilar(a: any, b: any): boolean {
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) < 1; // Less than 1 unit difference
    }
    return a === b;
  }
  
  /**
   * Clear all pending debounced calls
   */
  clearAll(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.lastValues.clear();
  }
}

/**
 * Mobile-optimized canvas operations with memory management
 */
export class MobileCanvasManager {
  private canvasPool: HTMLCanvasElement[] = [];
  private maxPoolSize: number;
  private capabilities: MobileCapabilities;
  
  constructor(capabilities: MobileCapabilities) {
    this.capabilities = capabilities;
    this.maxPoolSize = capabilities.isLowEndDevice ? 3 : 5;
  }
  
  /**
   * Get an optimized canvas from the pool or create a new one
   */
  getCanvas(dimensions: ImageDimensions): HTMLCanvasElement {
    // Try to reuse a canvas from the pool
    const reusableCanvas = this.canvasPool.find(canvas => 
      canvas.width === dimensions.width && canvas.height === dimensions.height
    );
    
    if (reusableCanvas) {
      // Remove from pool and clear
      const index = this.canvasPool.indexOf(reusableCanvas);
      this.canvasPool.splice(index, 1);
      
      const ctx = reusableCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, reusableCanvas.width, reusableCanvas.height);
      }
      
      return reusableCanvas;
    }
    
    // Create new canvas with mobile optimizations
    return this.createMobileOptimizedCanvas(dimensions);
  }
  
  /**
   * Return a canvas to the pool for reuse
   */
  returnCanvas(canvas: HTMLCanvasElement): void {
    if (this.canvasPool.length < this.maxPoolSize) {
      // Clear the canvas before returning to pool
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      this.canvasPool.push(canvas);
    } else {
      // Pool is full, clean up the canvas
      cleanupCanvas(canvas);
    }
  }
  
  /**
   * Create a mobile-optimized canvas
   */
  private createMobileOptimizedCanvas(dimensions: ImageDimensions): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    
    // Limit canvas size based on device capabilities
    const maxDimension = Math.min(
      dimensions.width,
      dimensions.height,
      this.capabilities.maxTextureSize,
      this.capabilities.isLowEndDevice ? 512 : 1024
    );
    
    const scale = Math.min(1, maxDimension / Math.max(dimensions.width, dimensions.height));
    
    canvas.width = Math.floor(dimensions.width * scale);
    canvas.height = Math.floor(dimensions.height * scale);
    
    // Mobile-specific optimizations
    const ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false,
      desynchronized: true // Enable async rendering
    });
    
    if (ctx) {
      // Optimize for mobile performance
      ctx.imageSmoothingEnabled = !this.capabilities.isLowEndDevice;
      ctx.imageSmoothingQuality = this.capabilities.isLowEndDevice ? 'low' : 'medium';
    }
    
    return canvas;
  }
  
  /**
   * Clean up all canvases in the pool
   */
  cleanup(): void {
    this.canvasPool.forEach(cleanupCanvas);
    this.canvasPool = [];
  }
  
  /**
   * Get memory usage statistics
   */
  getMemoryStats(): { poolSize: number; estimatedMemoryMB: number } {
    const estimatedMemoryMB = this.canvasPool.reduce((total, canvas) => {
      return total + (canvas.width * canvas.height * 4) / (1024 * 1024);
    }, 0);
    
    return {
      poolSize: this.canvasPool.length,
      estimatedMemoryMB
    };
  }
}

/**
 * Mobile-optimized animation timing and frame rate management
 */
export class MobileAnimationManager {
  private capabilities: MobileCapabilities;
  private targetFPS: number;
  private frameInterval: number;
  private lastFrameTime = 0;
  
  constructor(capabilities: MobileCapabilities) {
    this.capabilities = capabilities;
    this.targetFPS = this.getOptimalFPS();
    this.frameInterval = 1000 / this.targetFPS;
  }
  
  /**
   * Request animation frame with mobile-optimized timing
   */
  requestAnimationFrame(callback: FrameRequestCallback): number {
    return requestAnimationFrame((timestamp) => {
      // Throttle frame rate for mobile devices
      if (timestamp - this.lastFrameTime >= this.frameInterval) {
        this.lastFrameTime = timestamp;
        callback(timestamp);
      } else {
        // Skip this frame, request next one
        this.requestAnimationFrame(callback);
      }
    });
  }
  
  /**
   * Get CSS animation duration optimized for mobile
   */
  getOptimizedDuration(baseDuration: number): number {
    if (this.capabilities.isLowEndDevice) {
      return baseDuration * 1.5; // Slower animations for low-end devices
    } else if (this.capabilities.estimatedRAM >= 4096) {
      return baseDuration * 0.8; // Faster animations for high-end devices
    }
    return baseDuration;
  }
  
  /**
   * Get optimal easing function for mobile
   */
  getOptimizedEasing(): string {
    if (this.capabilities.isLowEndDevice) {
      return 'ease-out'; // Simpler easing for low-end devices
    }
    return 'cubic-bezier(0.4, 0.0, 0.2, 1)'; // Material design easing
  }
  
  private getOptimalFPS(): number {
    if (this.capabilities.isLowEndDevice) {
      return 30; // 30 FPS for low-end devices
    } else if (this.capabilities.batteryLevel && this.capabilities.batteryLevel < 20) {
      return 30; // Reduce FPS when battery is low
    }
    return 60; // 60 FPS for normal operation
  }
}

/**
 * Battery-aware performance optimization
 */
export class BatteryOptimizer {
  private capabilities: MobileCapabilities;
  private batteryLevel: number = 100;
  private isCharging: boolean = true;
  
  constructor(capabilities: MobileCapabilities) {
    this.capabilities = capabilities;
    this.initBatteryMonitoring();
  }
  
  private async initBatteryMonitoring(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        this.batteryLevel = battery.level * 100;
        this.isCharging = battery.charging;
        
        // Listen for battery changes
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level * 100;
        });
        
        battery.addEventListener('chargingchange', () => {
          this.isCharging = battery.charging;
        });
      } catch (error) {
        console.log('Battery API not available');
      }
    }
  }
  
  /**
   * Get performance mode based on battery status
   */
  getPerformanceMode(): 'high' | 'balanced' | 'battery-saver' {
    if (this.isCharging || this.batteryLevel > 50) {
      return 'high';
    } else if (this.batteryLevel > 20) {
      return 'balanced';
    } else {
      return 'battery-saver';
    }
  }
  
  /**
   * Get optimized processing configuration based on battery status
   */
  getBatteryOptimizedConfig(): Partial<OptimizationConfig> {
    const mode = this.getPerformanceMode();
    
    switch (mode) {
      case 'battery-saver':
        return {
          maxDimension: 384,
          qualityThreshold: 0.6,
          memoryThreshold: 20
        };
      case 'balanced':
        return {
          maxDimension: 512,
          qualityThreshold: 0.75,
          memoryThreshold: 40
        };
      case 'high':
      default:
        return {};
    }
  }
  
  /**
   * Should reduce processing quality based on battery status
   */
  shouldReduceQuality(): boolean {
    return this.getPerformanceMode() === 'battery-saver';
  }
  
  /**
   * Should skip non-essential animations based on battery status
   */
  shouldSkipAnimations(): boolean {
    return this.getPerformanceMode() === 'battery-saver';
  }
}

/**
 * Comprehensive mobile performance optimizer
 */
export class MobilePerformanceOptimizer {
  public capabilities: MobileCapabilities;
  public debouncer: TouchOptimizedDebouncer;
  public canvasManager: MobileCanvasManager;
  public animationManager: MobileAnimationManager;
  public batteryOptimizer: BatteryOptimizer;
  
  constructor() {
    this.capabilities = detectMobileCapabilities();
    this.debouncer = new TouchOptimizedDebouncer(this.capabilities);
    this.canvasManager = new MobileCanvasManager(this.capabilities);
    this.animationManager = new MobileAnimationManager(this.capabilities);
    this.batteryOptimizer = new BatteryOptimizer(this.capabilities);
  }
  
  /**
   * Get comprehensive optimization configuration
   */
  getOptimizationConfig(): OptimizationConfig {
    const mobileConfig = getMobileOptimizedConfig(this.capabilities);
    const batteryConfig = this.batteryOptimizer.getBatteryOptimizedConfig();
    
    return {
      ...mobileConfig,
      ...batteryConfig
    };
  }
  
  /**
   * Log performance statistics
   */
  logPerformanceStats(): void {
    const memoryStats = this.canvasManager.getMemoryStats();
    const memoryUsage = getMemoryUsage();
    
    console.log('Mobile Performance Stats:', {
      device: {
        isMobile: this.capabilities.isMobile,
        isLowEndDevice: this.capabilities.isLowEndDevice,
        estimatedRAM: this.capabilities.estimatedRAM,
        devicePixelRatio: this.capabilities.devicePixelRatio
      },
      memory: {
        canvasPool: memoryStats,
        jsHeap: memoryUsage
      },
      battery: {
        level: this.capabilities.batteryLevel,
        isCharging: this.capabilities.isCharging,
        performanceMode: this.batteryOptimizer.getPerformanceMode()
      }
    });
  }
  
  /**
   * Clean up all resources
   */
  cleanup(): void {
    this.debouncer.clearAll();
    this.canvasManager.cleanup();
  }
}