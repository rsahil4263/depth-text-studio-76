import { toast } from 'sonner';

/**
 * Error types that can occur during background removal processing
 */
export enum BackgroundRemovalErrorType {
  LIBRARY_INITIALIZATION = 'LIBRARY_INITIALIZATION',
  IMAGE_PROCESSING = 'IMAGE_PROCESSING',
  MEMORY_ERROR = 'MEMORY_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_FORMAT = 'INVALID_FORMAT',
  WEBASSEMBLY_ERROR = 'WEBASSEMBLY_ERROR',
  CANVAS_ERROR = 'CANVAS_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Structured error information for background removal failures
 */
export interface BackgroundRemovalError extends Error {
  type: BackgroundRemovalErrorType;
  originalError?: Error;
  userMessage: string;
  technicalDetails?: string;
  retryable: boolean;
}

/**
 * Error classification patterns to identify error types
 * Order matters - more specific patterns should come first
 */
const ERROR_PATTERNS = [
  {
    type: BackgroundRemovalErrorType.MEMORY_ERROR,
    patterns: [
      /out of memory/i,
      /memory allocation/i,
      /allocation failed/i,
      /heap/i,
      /maximum call stack/i,
      /memory.*limit/i
    ]
  },
  {
    type: BackgroundRemovalErrorType.WEBASSEMBLY_ERROR,
    patterns: [
      /webassembly/i,
      /wasm/i,
      /instantiate.*failed/i,
      /compile.*failed/i,
      /module.*failed/i
    ]
  },
  {
    type: BackgroundRemovalErrorType.CANVAS_ERROR,
    patterns: [
      /canvas.*context/i,
      /could not get.*context/i,
      /getcontext/i,
      /2d.*context/i
    ]
  },
  {
    type: BackgroundRemovalErrorType.INVALID_FORMAT,
    patterns: [
      /invalid.*format/i,
      /unsupported.*format/i,
      /invalid image/i,
      /decode.*failed/i,
      /corrupt.*image/i,
      /format.*detected/i
    ]
  },
  {
    type: BackgroundRemovalErrorType.NETWORK_ERROR,
    patterns: [
      /network.*request.*failed/i,
      /failed to fetch/i,
      /connection.*failed/i,
      /network.*timeout/i,
      /cors.*error/i,
      /fetch.*error/i
    ]
  },
  {
    type: BackgroundRemovalErrorType.LIBRARY_INITIALIZATION,
    patterns: [
      /initialization.*failed/i,
      /init.*failed/i,
      /setup.*failed/i,
      /configuration.*failed/i
    ]
  }
];

/**
 * User-friendly error messages for different error types
 */
const USER_MESSAGES = {
  [BackgroundRemovalErrorType.MEMORY_ERROR]: 'Image is too large for processing. Please try a smaller image.',
  [BackgroundRemovalErrorType.NETWORK_ERROR]: 'Network error occurred. Please check your connection and try again.',
  [BackgroundRemovalErrorType.INVALID_FORMAT]: 'Unsupported image format. Please use PNG, JPG, or JPEG.',
  [BackgroundRemovalErrorType.WEBASSEMBLY_ERROR]: 'Browser compatibility issue. Please try a different browser or update your current one.',
  [BackgroundRemovalErrorType.CANVAS_ERROR]: 'Image processing error. Please try again with a different image.',
  [BackgroundRemovalErrorType.LIBRARY_INITIALIZATION]: 'Processing engine failed to start. Please refresh the page and try again.',
  [BackgroundRemovalErrorType.IMAGE_PROCESSING]: 'Could not process image. Please try another one.',
  [BackgroundRemovalErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

/**
 * Determines if an error type is retryable
 */
const RETRYABLE_ERRORS = new Set([
  BackgroundRemovalErrorType.NETWORK_ERROR,
  BackgroundRemovalErrorType.LIBRARY_INITIALIZATION,
  BackgroundRemovalErrorType.IMAGE_PROCESSING,
  BackgroundRemovalErrorType.UNKNOWN_ERROR
]);

/**
 * Classifies an error based on its message and properties
 */
function classifyError(error: Error): BackgroundRemovalErrorType {
  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';
  const combinedText = `${errorMessage} ${errorStack}`;

  // Check patterns in order (most specific first)
  for (const { type, patterns } of ERROR_PATTERNS) {
    if (patterns.some(pattern => pattern.test(combinedText))) {
      return type;
    }
  }

  return BackgroundRemovalErrorType.UNKNOWN_ERROR;
}

/**
 * Creates a structured BackgroundRemovalError from a generic error
 */
export function createBackgroundRemovalError(
  error: Error,
  context?: string
): BackgroundRemovalError {
  const errorType = classifyError(error);
  const userMessage = USER_MESSAGES[errorType];
  const retryable = RETRYABLE_ERRORS.has(errorType);

  const structuredError = new Error(userMessage) as BackgroundRemovalError;
  structuredError.type = errorType;
  structuredError.originalError = error;
  structuredError.userMessage = userMessage;
  structuredError.technicalDetails = context ? `${context}: ${error.message}` : error.message;
  structuredError.retryable = retryable;
  structuredError.name = 'BackgroundRemovalError';

  return structuredError;
}

/**
 * Logs error information for debugging while maintaining user privacy
 */
function logError(error: BackgroundRemovalError, context?: string): void {
  const logData = {
    type: error.type,
    retryable: error.retryable,
    context: context || 'unknown',
    timestamp: new Date().toISOString(),
    // Only log technical details, not user data
    technicalDetails: error.technicalDetails,
    userAgent: navigator.userAgent,
    // Browser capabilities that might be relevant
    webAssemblySupported: typeof WebAssembly !== 'undefined',
    canvasSupported: typeof HTMLCanvasElement !== 'undefined'
  };

  console.error('Background Removal Error:', logData);
  
  // In a production environment, you might want to send this to an error tracking service
  // Example: errorTrackingService.captureError(logData);
}

/**
 * Displays user-friendly error message via toast notification
 */
function showErrorToast(error: BackgroundRemovalError): void {
  toast.error(error.userMessage, {
    duration: 5000,
    description: error.retryable ? 'You can try again or use a different image.' : undefined
  });
}

/**
 * Comprehensive error handler for background removal operations
 */
export function handleBackgroundRemovalError(
  error: Error,
  context?: string
): BackgroundRemovalError {
  // Create structured error
  const structuredError = createBackgroundRemovalError(error, context);
  
  // Log error for debugging
  logError(structuredError, context);
  
  // Show user-friendly notification
  showErrorToast(structuredError);
  
  return structuredError;
}

/**
 * Wrapper function for background removal operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const structuredError = handleBackgroundRemovalError(
      error instanceof Error ? error : new Error(String(error)),
      context
    );
    throw structuredError;
  }
}

/**
 * Validates browser compatibility for background removal
 */
export function validateBrowserCompatibility(): void {
  const issues: string[] = [];

  if (typeof WebAssembly === 'undefined') {
    issues.push('WebAssembly not supported');
  }

  if (typeof HTMLCanvasElement === 'undefined') {
    issues.push('Canvas API not supported');
  }

  if (typeof File === 'undefined' || typeof Blob === 'undefined') {
    issues.push('File API not supported');
  }

  if (issues.length > 0) {
    const error = new Error(`Browser compatibility issues: ${issues.join(', ')}`);
    throw handleBackgroundRemovalError(error, 'Browser compatibility check');
  }
}

/**
 * Error recovery strategies for different error types
 */
export const ErrorRecoveryStrategies = {
  /**
   * Suggests recovery actions for memory errors
   */
  [BackgroundRemovalErrorType.MEMORY_ERROR]: {
    suggestions: [
      'Try a smaller image (recommended: under 2MB)',
      'Close other browser tabs to free up memory',
      'Use an image with lower resolution'
    ],
    autoRetry: false
  },

  /**
   * Suggests recovery actions for network errors
   */
  [BackgroundRemovalErrorType.NETWORK_ERROR]: {
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Refresh the page if the problem persists'
    ],
    autoRetry: true,
    retryDelay: 2000
  },

  /**
   * Suggests recovery actions for format errors
   */
  [BackgroundRemovalErrorType.INVALID_FORMAT]: {
    suggestions: [
      'Use PNG, JPG, or JPEG format',
      'Ensure the image file is not corrupted',
      'Try converting the image to a supported format'
    ],
    autoRetry: false
  },

  /**
   * Suggests recovery actions for WebAssembly errors
   */
  [BackgroundRemovalErrorType.WEBASSEMBLY_ERROR]: {
    suggestions: [
      'Update your browser to the latest version',
      'Try using Chrome, Firefox, Safari, or Edge',
      'Enable JavaScript if it\'s disabled'
    ],
    autoRetry: false
  }
};