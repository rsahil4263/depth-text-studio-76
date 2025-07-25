/**
 * Browser compatibility validation and feature detection utilities
 * for cross-browser background removal functionality
 */

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  isSupported: boolean;
  features: BrowserFeatures;
  warnings: string[];
}

export interface BrowserFeatures {
  webAssembly: boolean;
  canvas2d: boolean;
  fileApi: boolean;
  urlApi: boolean;
  performanceApi: boolean;
  corsHeaders: boolean;
  imageFormats: {
    png: boolean;
    jpeg: boolean;
    webp: boolean;
  };
}

/**
 * Detect current browser information
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  const warnings: string[] = [];
  
  // Browser detection
  let name = 'Unknown';
  let version = 'Unknown';
  let engine = 'Unknown';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'Blink';
  } else if (userAgent.includes('Edg')) {
    name = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'Blink';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'Gecko';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'WebKit';
  }
  
  // Feature detection
  const features = detectBrowserFeatures();
  
  // Check for known compatibility issues
  if (name === 'Safari' && parseInt(version) < 14) {
    warnings.push('Safari versions below 14 may have limited WebAssembly support');
  }
  
  if (name === 'Firefox' && parseInt(version) < 100) {
    warnings.push('Firefox versions below 100 may have performance issues with large images');
  }
  
  if (name === 'Chrome' && parseInt(version) < 90) {
    warnings.push('Chrome versions below 90 may not support all required CORS headers');
  }
  
  // Overall support determination
  const isSupported = features.webAssembly && 
                     features.canvas2d && 
                     features.fileApi && 
                     features.urlApi;
  
  if (!isSupported) {
    warnings.push('Browser does not support all required features for background removal');
  }
  
  return {
    name,
    version,
    engine,
    isSupported,
    features,
    warnings
  };
}

/**
 * Detect browser feature support
 */
export function detectBrowserFeatures(): BrowserFeatures {
  const features: BrowserFeatures = {
    webAssembly: false,
    canvas2d: false,
    fileApi: false,
    urlApi: false,
    performanceApi: false,
    corsHeaders: false,
    imageFormats: {
      png: false,
      jpeg: false,
      webp: false
    }
  };
  
  // WebAssembly support
  try {
    features.webAssembly = typeof WebAssembly === 'object' && 
                          typeof WebAssembly.instantiate === 'function';
  } catch (e) {
    features.webAssembly = false;
  }
  
  // Canvas 2D support
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    features.canvas2d = ctx !== null && typeof ctx.drawImage === 'function';
  } catch (e) {
    features.canvas2d = false;
  }
  
  // File API support
  features.fileApi = typeof File !== 'undefined' && 
                    typeof FileReader !== 'undefined' && 
                    typeof Blob !== 'undefined';
  
  // URL API support
  features.urlApi = typeof URL !== 'undefined' && 
                   typeof URL.createObjectURL === 'function' && 
                   typeof URL.revokeObjectURL === 'function';
  
  // Performance API support
  features.performanceApi = typeof performance !== 'undefined' && 
                           typeof performance.now === 'function';
  
  // CORS headers support (basic check)
  features.corsHeaders = typeof Headers !== 'undefined';
  
  // Image format support detection
  features.imageFormats = detectImageFormatSupport();
  
  return features;
}

/**
 * Detect supported image formats
 */
function detectImageFormatSupport(): BrowserFeatures['imageFormats'] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  const formats = {
    png: false,
    jpeg: false,
    webp: false
  };
  
  try {
    // PNG support (should be universal)
    formats.png = canvas.toDataURL('image/png').indexOf('data:image/png') === 0;
    
    // JPEG support (should be universal)
    formats.jpeg = canvas.toDataURL('image/jpeg').indexOf('data:image/jpeg') === 0;
    
    // WebP support (newer browsers)
    formats.webp = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    // Fallback to basic support
    formats.png = true;
    formats.jpeg = true;
    formats.webp = false;
  }
  
  return formats;
}

/**
 * Validate browser compatibility and throw error if not supported
 */
export function validateBrowserCompatibility(): void {
  const browserInfo = detectBrowser();
  
  if (!browserInfo.isSupported) {
    const missingFeatures = [];
    
    if (!browserInfo.features.webAssembly) {
      missingFeatures.push('WebAssembly');
    }
    if (!browserInfo.features.canvas2d) {
      missingFeatures.push('Canvas 2D');
    }
    if (!browserInfo.features.fileApi) {
      missingFeatures.push('File API');
    }
    if (!browserInfo.features.urlApi) {
      missingFeatures.push('URL API');
    }
    
    throw new Error(
      `Browser compatibility error: Your browser (${browserInfo.name} ${browserInfo.version}) ` +
      `does not support the following required features: ${missingFeatures.join(', ')}. ` +
      `Please use a modern browser like Chrome 90+, Firefox 100+, Safari 14+, or Edge 90+.`
    );
  }
  
  // Log warnings if any
  if (browserInfo.warnings.length > 0) {
    console.warn('Browser compatibility warnings:', browserInfo.warnings);
  }
}

/**
 * Get performance characteristics for the current browser
 */
export function getBrowserPerformanceProfile(): {
  expectedProcessingTime: number;
  maxImageSize: number;
  memoryLimit: number;
  optimizationLevel: 'high' | 'medium' | 'low';
} {
  const browserInfo = detectBrowser();
  
  // Default profile
  let profile = {
    expectedProcessingTime: 3000, // 3 seconds
    maxImageSize: 10 * 1024 * 1024, // 10MB
    memoryLimit: 512 * 1024 * 1024, // 512MB
    optimizationLevel: 'medium' as const
  };
  
  // Browser-specific optimizations
  switch (browserInfo.name) {
    case 'Chrome':
      profile = {
        expectedProcessingTime: 2000, // Chrome is typically fastest
        maxImageSize: 15 * 1024 * 1024, // 15MB
        memoryLimit: 1024 * 1024 * 1024, // 1GB
        optimizationLevel: 'high'
      };
      break;
      
    case 'Edge':
      profile = {
        expectedProcessingTime: 2500, // Similar to Chrome
        maxImageSize: 12 * 1024 * 1024, // 12MB
        memoryLimit: 768 * 1024 * 1024, // 768MB
        optimizationLevel: 'high'
      };
      break;
      
    case 'Firefox':
      profile = {
        expectedProcessingTime: 3500, // Slightly slower WebAssembly
        maxImageSize: 8 * 1024 * 1024, // 8MB
        memoryLimit: 512 * 1024 * 1024, // 512MB
        optimizationLevel: 'medium'
      };
      break;
      
    case 'Safari':
      profile = {
        expectedProcessingTime: 4000, // Conservative estimate
        maxImageSize: 6 * 1024 * 1024, // 6MB
        memoryLimit: 256 * 1024 * 1024, // 256MB
        optimizationLevel: 'low'
      };
      break;
  }
  
  return profile;
}

/**
 * Test CORS header support
 */
export function testCorsSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Create a test request to check CORS header handling
      const testUrl = 'data:text/plain,test';
      
      fetch(testUrl, {
        method: 'GET',
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp'
        }
      })
      .then(() => resolve(true))
      .catch(() => resolve(false));
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Comprehensive browser compatibility test
 */
export async function runCompatibilityTest(): Promise<{
  passed: boolean;
  results: {
    browserInfo: BrowserInfo;
    performanceProfile: ReturnType<typeof getBrowserPerformanceProfile>;
    corsSupport: boolean;
    testResults: {
      webAssembly: boolean;
      canvas: boolean;
      fileHandling: boolean;
      imageProcessing: boolean;
    };
  };
  recommendations: string[];
}> {
  const browserInfo = detectBrowser();
  const performanceProfile = getBrowserPerformanceProfile();
  const corsSupport = await testCorsSupport();
  const recommendations: string[] = [];
  
  // Test WebAssembly
  let webAssemblyTest = false;
  try {
    webAssemblyTest = typeof WebAssembly === 'object' && 
                     typeof WebAssembly.instantiate === 'function';
  } catch (e) {
    webAssemblyTest = false;
    recommendations.push('Update your browser to support WebAssembly');
  }
  
  // Test Canvas
  let canvasTest = false;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvasTest = ctx !== null;
    
    if (ctx) {
      // Test canvas operations
      ctx.fillRect(0, 0, 1, 1);
      const imageData = ctx.getImageData(0, 0, 1, 1);
      canvasTest = imageData.data.length === 4;
    }
  } catch (e) {
    canvasTest = false;
    recommendations.push('Canvas 2D support is required');
  }
  
  // Test File handling
  let fileHandlingTest = false;
  try {
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const url = URL.createObjectURL(testBlob);
    URL.revokeObjectURL(url);
    fileHandlingTest = true;
  } catch (e) {
    fileHandlingTest = false;
    recommendations.push('File API support is required');
  }
  
  // Test Image processing
  let imageProcessingTest = false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/png');
    imageProcessingTest = dataUrl.startsWith('data:image/png');
  } catch (e) {
    imageProcessingTest = false;
    recommendations.push('Image processing capabilities are limited');
  }
  
  // Add browser-specific recommendations
  if (browserInfo.name === 'Safari' && parseInt(browserInfo.version) < 14) {
    recommendations.push('Update Safari to version 14 or later for better performance');
  }
  
  if (browserInfo.name === 'Firefox' && parseInt(browserInfo.version) < 100) {
    recommendations.push('Update Firefox to version 100 or later for optimal performance');
  }
  
  if (!corsSupport) {
    recommendations.push('CORS headers may not be properly configured');
  }
  
  const testResults = {
    webAssembly: webAssemblyTest,
    canvas: canvasTest,
    fileHandling: fileHandlingTest,
    imageProcessing: imageProcessingTest
  };
  
  const passed = Object.values(testResults).every(result => result) && 
                browserInfo.isSupported && 
                corsSupport;
  
  return {
    passed,
    results: {
      browserInfo,
      performanceProfile,
      corsSupport,
      testResults
    },
    recommendations
  };
}

/**
 * Log browser compatibility information to console
 */
export function logBrowserCompatibility(): void {
  const browserInfo = detectBrowser();
  
  console.group('🌐 Browser Compatibility Report');
  console.log(`Browser: ${browserInfo.name} ${browserInfo.version} (${browserInfo.engine})`);
  console.log(`Supported: ${browserInfo.isSupported ? '✅' : '❌'}`);
  
  console.group('Features:');
  console.log(`WebAssembly: ${browserInfo.features.webAssembly ? '✅' : '❌'}`);
  console.log(`Canvas 2D: ${browserInfo.features.canvas2d ? '✅' : '❌'}`);
  console.log(`File API: ${browserInfo.features.fileApi ? '✅' : '❌'}`);
  console.log(`URL API: ${browserInfo.features.urlApi ? '✅' : '❌'}`);
  console.log(`Performance API: ${browserInfo.features.performanceApi ? '✅' : '❌'}`);
  console.log(`CORS Headers: ${browserInfo.features.corsHeaders ? '✅' : '❌'}`);
  console.groupEnd();
  
  console.group('Image Formats:');
  console.log(`PNG: ${browserInfo.features.imageFormats.png ? '✅' : '❌'}`);
  console.log(`JPEG: ${browserInfo.features.imageFormats.jpeg ? '✅' : '❌'}`);
  console.log(`WebP: ${browserInfo.features.imageFormats.webp ? '✅' : '❌'}`);
  console.groupEnd();
  
  if (browserInfo.warnings.length > 0) {
    console.group('⚠️ Warnings:');
    browserInfo.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }
  
  const performanceProfile = getBrowserPerformanceProfile();
  console.group('Performance Profile:');
  console.log(`Expected processing time: ${performanceProfile.expectedProcessingTime}ms`);
  console.log(`Max image size: ${(performanceProfile.maxImageSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Memory limit: ${(performanceProfile.memoryLimit / 1024 / 1024).toFixed(0)}MB`);
  console.log(`Optimization level: ${performanceProfile.optimizationLevel}`);
  console.groupEnd();
  
  console.groupEnd();
}