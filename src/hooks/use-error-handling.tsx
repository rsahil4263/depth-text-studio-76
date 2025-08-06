import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  handleBackgroundRemovalError, 
  BackgroundRemovalError, 
  ErrorRecoveryStrategies,
  BackgroundRemovalErrorType 
} from '@/lib/errorHandling';
import { 
  detectBrowser, 
  validateBrowserCompatibility, 
  getBrowserPerformanceProfile,
  runCompatibilityTest 
} from '@/lib/browserCompatibility';

interface ErrorState {
  error: BackgroundRemovalError | null;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  lastErrorTime: number;
}

interface UseErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  showToasts?: boolean;
  logErrors?: boolean;
  onError?: (error: BackgroundRemovalError) => void;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesReached?: (error: BackgroundRemovalError) => void;
}

interface UseErrorHandlingReturn {
  error: BackgroundRemovalError | null;
  isRetrying: boolean;
  retryCount: number;
  handleError: (error: Error, context?: string) => BackgroundRemovalError;
  retry: () => Promise<void>;
  clearError: () => void;
  canRetry: boolean;
  getRecoveryStrategies: () => typeof ErrorRecoveryStrategies[BackgroundRemovalErrorType] | null;
  browserCompatibility: {
    isSupported: boolean;
    issues: string[];
    performanceProfile: ReturnType<typeof getBrowserPerformanceProfile>;
  };
}

/**
 * Enhanced error handling hook with retry logic, browser compatibility checks,
 * and integration with existing error handling services
 */
export const useErrorHandling = (options: UseErrorHandlingOptions = {}): UseErrorHandlingReturn => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    showToasts = true,
    logErrors = true,
    onError,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    maxRetries,
    lastErrorTime: 0
  });

  const [browserCompatibility, setBrowserCompatibility] = useState({
    isSupported: true,
    issues: [] as string[],
    performanceProfile: getBrowserPerformanceProfile()
  });

  // Check browser compatibility on mount
  useEffect(() => {
    const checkCompatibility = async () => {
      try {
        validateBrowserCompatibility();
        const compatibilityTest = await runCompatibilityTest();
        
        setBrowserCompatibility({
          isSupported: compatibilityTest.passed,
          issues: compatibilityTest.recommendations,
          performanceProfile: compatibilityTest.results.performanceProfile
        });

        if (!compatibilityTest.passed && showToasts) {
          toast.warning('Browser Compatibility Issues Detected', {
            description: 'Some features may not work properly. Consider updating your browser.',
            duration: 8000,
            action: {
              label: 'View Details',
              onClick: () => {
                console.log('Browser Compatibility Report:', compatibilityTest);
                toast.info('Compatibility details logged to console', {
                  duration: 3000
                });
              }
            }
          });
        }
      } catch (error) {
        const browserInfo = detectBrowser();
        setBrowserCompatibility({
          isSupported: false,
          issues: [error instanceof Error ? error.message : 'Unknown compatibility issue'],
          performanceProfile: getBrowserPerformanceProfile()
        });

        if (showToasts) {
          toast.error('Browser Not Supported', {
            description: `Your browser (${browserInfo.name} ${browserInfo.version}) may not support all features.`,
            duration: 10000
          });
        }
      }
    };

    checkCompatibility();
  }, [showToasts]);

  /**
   * Handle errors with structured error processing and user feedback
   */
  const handleError = useCallback((error: Error, context?: string): BackgroundRemovalError => {
    const structuredError = handleBackgroundRemovalError(error, context);
    
    // Update error state
    setErrorState(prev => ({
      ...prev,
      error: structuredError,
      lastErrorTime: Date.now(),
      retryCount: 0 // Reset retry count for new errors
    }));

    // Log error if enabled
    if (logErrors) {
      console.error('Error handled by useErrorHandling:', {
        error: structuredError,
        context,
        timestamp: new Date().toISOString(),
        browserCompatibility
      });
    }

    // Show toast notification if enabled
    if (showToasts) {
      const recoveryStrategies = ErrorRecoveryStrategies[structuredError.type];
      
      toast.error(structuredError.userMessage, {
        duration: 6000,
        description: recoveryStrategies?.suggestions?.[0] || 'Please try again or contact support.',
        action: structuredError.retryable ? {
          label: 'Retry',
          onClick: () => retry()
        } : undefined
      });
    }

    // Call error callback
    if (onError) {
      onError(structuredError);
    }

    return structuredError;
  }, [logErrors, showToasts, browserCompatibility, onError]);

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(async (): Promise<void> => {
    if (!errorState.error || !errorState.error.retryable || errorState.retryCount >= maxRetries) {
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }));

    // Show retry notification
    if (showToasts) {
      toast.info(`Retrying... (${errorState.retryCount + 1}/${maxRetries})`, {
        duration: 2000
      });
    }

    // Call retry callback
    if (onRetry) {
      onRetry(errorState.retryCount + 1);
    }

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Check if we've reached max retries
    if (errorState.retryCount + 1 >= maxRetries) {
      setErrorState(prev => ({
        ...prev,
        isRetrying: false
      }));

      if (showToasts) {
        toast.error('Maximum retries reached', {
          description: 'Please refresh the page or try a different approach.',
          duration: 8000,
          action: {
            label: 'Refresh Page',
            onClick: () => window.location.reload()
          }
        });
      }

      if (onMaxRetriesReached && errorState.error) {
        onMaxRetriesReached(errorState.error);
      }
    } else {
      setErrorState(prev => ({
        ...prev,
        isRetrying: false
      }));
    }
  }, [errorState, maxRetries, retryDelay, showToasts, onRetry, onMaxRetriesReached]);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      maxRetries,
      lastErrorTime: 0
    });
  }, [maxRetries]);

  /**
   * Get recovery strategies for the current error
   */
  const getRecoveryStrategies = useCallback(() => {
    if (!errorState.error) return null;
    return ErrorRecoveryStrategies[errorState.error.type] || null;
  }, [errorState.error]);

  /**
   * Check if retry is possible
   */
  const canRetry = errorState.error?.retryable === true && 
                   errorState.retryCount < maxRetries && 
                   !errorState.isRetrying;

  return {
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    handleError,
    retry,
    clearError,
    canRetry,
    getRecoveryStrategies,
    browserCompatibility
  };
};

/**
 * Hook for handling async operations with error handling and loading states
 */
export const useAsyncOperation = <T,>(
  operation: () => Promise<T>,
  options: UseErrorHandlingOptions & {
    onSuccess?: (result: T) => void;
    onStart?: () => void;
    onComplete?: () => void;
  } = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const errorHandling = useErrorHandling(options);

  const execute = useCallback(async (context?: string): Promise<T | null> => {
    try {
      setIsLoading(true);
      errorHandling.clearError();
      
      if (options.onStart) {
        options.onStart();
      }

      const result = await operation();
      setResult(result);

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const structuredError = errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw structuredError;
    } finally {
      setIsLoading(false);
      
      if (options.onComplete) {
        options.onComplete();
      }
    }
  }, [operation, errorHandling, options]);

  const retryOperation = useCallback(async (context?: string) => {
    if (errorHandling.canRetry) {
      await errorHandling.retry();
      return execute(context);
    }
    return null;
  }, [errorHandling, execute]);

  return {
    execute,
    retry: retryOperation,
    isLoading,
    result,
    ...errorHandling
  };
};

export default useErrorHandling;