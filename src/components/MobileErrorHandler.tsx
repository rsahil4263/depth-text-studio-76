import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BackgroundRemovalError, BackgroundRemovalErrorType } from '@/lib/errorHandling';
import { detectBrowser } from '@/lib/browserCompatibility';
import { LoadingState } from './LoadingState';

interface MobileErrorHandlerProps {
  error: BackgroundRemovalError | null;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onDismiss: () => void;
  onReportError?: (error: BackgroundRemovalError) => void;
  className?: string;
}

interface MobileErrorToastOptions {
  error: BackgroundRemovalError;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Mobile-optimized error display component with touch-friendly interactions
 */
export const MobileErrorDisplay: React.FC<MobileErrorHandlerProps> = ({
  error,
  isRetrying,
  retryCount,
  maxRetries,
  onRetry,
  onDismiss,
  onReportError,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsDismissing(false);
    }
  }, [error]);

  const handleDismiss = useCallback(() => {
    setIsDismissing(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  }, [onDismiss]);

  const handleRetry = useCallback(() => {
    // Add haptic feedback if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onRetry();
  }, [onRetry]);

  const handleReportError = useCallback(() => {
    if (error && onReportError) {
      onReportError(error);
    }
  }, [error, onReportError]);

  const getErrorIcon = (errorType: BackgroundRemovalErrorType): string => {
    switch (errorType) {
      case BackgroundRemovalErrorType.MEMORY_ERROR:
        return '🧠';
      case BackgroundRemovalErrorType.NETWORK_ERROR:
        return '📡';
      case BackgroundRemovalErrorType.INVALID_FORMAT:
        return '📄';
      case BackgroundRemovalErrorType.WEBASSEMBLY_ERROR:
        return '⚙️';
      case BackgroundRemovalErrorType.CANVAS_ERROR:
        return '🖼️';
      case BackgroundRemovalErrorType.LIBRARY_INITIALIZATION:
        return '🔧';
      default:
        return '⚠️';
    }
  };

  const getErrorColor = (errorType: BackgroundRemovalErrorType): string => {
    switch (errorType) {
      case BackgroundRemovalErrorType.MEMORY_ERROR:
        return 'border-orange-500 bg-orange-500/10';
      case BackgroundRemovalErrorType.NETWORK_ERROR:
        return 'border-blue-500 bg-blue-500/10';
      case BackgroundRemovalErrorType.INVALID_FORMAT:
        return 'border-yellow-500 bg-yellow-500/10';
      case BackgroundRemovalErrorType.WEBASSEMBLY_ERROR:
        return 'border-purple-500 bg-purple-500/10';
      case BackgroundRemovalErrorType.CANVAS_ERROR:
        return 'border-pink-500 bg-pink-500/10';
      default:
        return 'border-red-500 bg-red-500/10';
    }
  };

  if (!error || !isVisible) {
    return null;
  }

  const canRetry = error.retryable && retryCount < maxRetries && !isRetrying;
  const browserInfo = detectBrowser();

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center p-4 ${className}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Error Panel */}
      <div className={`
        relative w-full max-w-sm bg-[#191919] rounded-t-2xl border-t-2 
        ${getErrorColor(error.type)}
        transform transition-all duration-300 ease-out
        ${isDismissing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
      `}>
        {/* Handle Bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        <div className="p-6">
          {/* Error Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">
              {getErrorIcon(error.type)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {isRetrying ? 'Retrying...' : 'Something went wrong'}
              </h3>
              <p className="text-sm text-gray-400">
                {error.type.replace(/_/g, ' ').toLowerCase()}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Loading State for Retry */}
          {isRetrying && (
            <div className="mb-4">
              <LoadingState
                message={`Retrying... (${retryCount}/${maxRetries})`}
                size="small"
                variant="spinner"
              />
            </div>
          )}

          {/* Error Message */}
          <p className="text-gray-300 mb-4 leading-relaxed">
            {error.userMessage}
          </p>

          {/* Browser Info (if relevant) */}
          {!browserInfo.isSupported && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <strong>Browser Issue:</strong> {browserInfo.name} {browserInfo.version} may not support all features.
              </p>
            </div>
          )}

          {/* Retry Information */}
          {error.retryable && retryCount > 0 && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                Retry attempts: {retryCount}/{maxRetries}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {canRetry && (
              <button
                onClick={handleRetry}
                className="w-full bg-[#20B2AA] hover:bg-[#1a9b94] text-white font-medium py-3 px-4 rounded-xl transition-colors active:scale-95"
              >
                Try Again ({maxRetries - retryCount} attempts left)
              </button>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDismiss}
                className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-xl transition-colors active:scale-95"
              >
                Dismiss
              </button>
              
              {onReportError && (
                <button
                  onClick={handleReportError}
                  className="bg-transparent border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-xl transition-colors active:scale-95"
                >
                  Report
                </button>
              )}
            </div>
          </div>

          {/* Swipe Hint */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Swipe down or tap outside to dismiss
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Mobile-optimized toast notifications for errors
 */
export const showMobileErrorToast = ({
  error,
  onRetry,
  onDismiss,
  retryCount = 0,
  maxRetries = 3
}: MobileErrorToastOptions) => {
  const canRetry = error.retryable && retryCount < maxRetries;
  
  // Add haptic feedback for error
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }

  toast.error(error.userMessage, {
    duration: canRetry ? 8000 : 5000,
    description: canRetry 
      ? `Tap to retry (${maxRetries - retryCount} attempts left)`
      : 'Please try a different approach',
    action: canRetry ? {
      label: 'Retry',
      onClick: () => {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onRetry?.();
      }
    } : undefined,
    onDismiss: onDismiss,
    className: 'mobile-error-toast',
    style: {
      fontSize: '16px', // Larger text for mobile
      padding: '16px',
      borderRadius: '12px'
    }
  });
};

/**
 * Mobile error status bar component
 */
export const MobileErrorStatusBar: React.FC<{
  error: BackgroundRemovalError | null;
  isRetrying: boolean;
  onTap?: () => void;
  className?: string;
}> = ({
  error,
  isRetrying,
  onTap,
  className = ''
}) => {
  if (!error && !isRetrying) {
    return null;
  }

  const handleTap = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onTap?.();
  };

  return (
    <div 
      className={`
        fixed top-0 left-0 right-0 z-40 bg-red-500 text-white px-4 py-2 text-sm font-medium
        transform transition-transform duration-300 ease-out
        ${error || isRetrying ? 'translate-y-0' : '-translate-y-full'}
        ${onTap ? 'cursor-pointer active:bg-red-600' : ''}
        ${className}
      `}
      onClick={handleTap}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isRetrying ? (
            <>
              <div className="w-4 h-4 animate-spin">
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              <span>Retrying...</span>
            </>
          ) : (
            <>
              <span>⚠️</span>
              <span>Error occurred</span>
            </>
          )}
        </div>
        {onTap && (
          <span className="text-xs opacity-75">Tap for details</span>
        )}
      </div>
    </div>
  );
};

export default MobileErrorDisplay;