import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';
import { handleBackgroundRemovalError, BackgroundRemovalError } from '@/lib/errorHandling';
import { detectBrowser, validateBrowserCompatibility } from '@/lib/browserCompatibility';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error with structured information
    this.logError(error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call the optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Handle the error using the existing error handling service
    const structuredError = handleBackgroundRemovalError(error, 'React Component Error');
    
    // Show user-friendly error notification
    this.showErrorNotification(structuredError);
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const browserInfo = detectBrowser();
    
    const errorReport = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      browserInfo: {
        name: browserInfo.name,
        version: browserInfo.version,
        engine: browserInfo.engine,
        isSupported: browserInfo.isSupported
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
      retryCount: this.state.retryCount
    };

    console.error('🚨 React Error Boundary Caught Error:', errorReport);
    
    // In production, you might want to send this to an error tracking service
    // Example: errorTrackingService.captureError(errorReport);
  };

  private showErrorNotification = (structuredError: BackgroundRemovalError) => {
    toast.error('Application Error', {
      description: structuredError.userMessage,
      duration: 6000,
      action: structuredError.retryable ? {
        label: 'Retry',
        onClick: () => this.handleRetry()
      } : undefined
    });
  };

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      toast.error('Maximum retries reached', {
        description: 'Please refresh the page to continue.',
        duration: 8000,
        action: {
          label: 'Refresh Page',
          onClick: () => window.location.reload()
        }
      });
      return;
    }

    // Show retry attempt notification
    toast.info(`Retrying... (${this.state.retryCount + 1}/${this.maxRetries})`, {
      duration: 2000
    });

    // Reset error state after a short delay
    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1
      });
    }, 1000);

    this.retryTimeouts.push(timeout);
  };

  private handleRefreshPage = () => {
    window.location.reload();
  };

  private handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        toast.success('Error report copied to clipboard', {
          description: 'You can now paste this information when reporting the issue.',
          duration: 4000
        });
      })
      .catch(() => {
        toast.error('Failed to copy error report', {
          description: 'Please manually copy the error information from the console.',
          duration: 4000
        });
      });
  };

  private getBrowserCompatibilityIssues = (): string[] => {
    try {
      validateBrowserCompatibility();
      return [];
    } catch (error) {
      return [error instanceof Error ? error.message : 'Unknown compatibility issue'];
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const compatibilityIssues = this.getBrowserCompatibilityIssues();
      const browserInfo = detectBrowser();
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-[#1F2121] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#191919] rounded-lg border border-[#333] p-6 text-center">
            {/* Error Icon */}
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-gray-400 mb-6">
              The application encountered an unexpected error. This might be due to a temporary issue or browser compatibility problem.
            </p>

            {/* Browser Compatibility Issues */}
            {compatibilityIssues.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h3 className="text-yellow-400 font-medium mb-2">Browser Compatibility Issues:</h3>
                <ul className="text-sm text-yellow-300 text-left space-y-1">
                  {compatibilityIssues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Browser Information */}
            <div className="mb-6 p-3 bg-gray-800/50 rounded-lg text-sm text-gray-400">
              <p>Browser: {browserInfo.name} {browserInfo.version}</p>
              <p>Supported: {browserInfo.isSupported ? '✅' : '❌'}</p>
              {this.state.retryCount > 0 && (
                <p>Retry attempts: {this.state.retryCount}/{this.maxRetries}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-[#20B2AA] hover:bg-[#1a9b94] text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </button>
              )}
              
              <button
                onClick={this.handleRefreshPage}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
              
              <button
                onClick={this.handleReportError}
                className="w-full bg-transparent border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Copy Error Report
              </button>
            </div>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-gray-400 hover:text-white">
                  Technical Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-900 rounded text-xs text-red-400 font-mono overflow-auto max-h-40">
                  <p><strong>Error:</strong> {this.state.error.message}</p>
                  {this.state.error.stack && (
                    <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 whitespace-pre-wrap">
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;