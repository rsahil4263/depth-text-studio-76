import React from 'react';

interface LoadingStateProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  className?: string;
}

/**
 * Loading state component with multiple variants and progress support
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  progress,
  showProgress = false,
  size = 'medium',
  variant = 'spinner',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const containerSizeClasses = {
    small: 'gap-2 text-sm',
    medium: 'gap-3 text-base',
    large: 'gap-4 text-lg'
  };

  const renderSpinner = () => (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg
        className="w-full h-full text-[#20B2AA]"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${size === 'small' ? 'w-2 h-2' : size === 'medium' ? 'w-3 h-3' : 'w-4 h-4'} bg-[#20B2AA] rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} bg-[#20B2AA] rounded-full animate-pulse opacity-60`} />
  );

  const renderSkeleton = () => (
    <div className="space-y-2">
      <div className="h-4 bg-gray-700 rounded animate-pulse" />
      <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
      <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2" />
    </div>
  );

  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizeClasses[size]} ${className}`}>
      {variant !== 'skeleton' && renderLoadingIndicator()}
      
      {variant === 'skeleton' ? (
        renderSkeleton()
      ) : (
        <>
          {message && (
            <p className="text-gray-300 text-center font-medium">
              {message}
            </p>
          )}
          
          {showProgress && typeof progress === 'number' && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-[#20B2AA] h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Full-screen loading overlay component
 */
export const LoadingOverlay: React.FC<LoadingStateProps & { 
  isVisible: boolean;
  backdrop?: boolean;
}> = ({
  isVisible,
  backdrop = true,
  ...props
}) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${
      backdrop ? 'bg-black/50 backdrop-blur-sm' : ''
    }`}>
      <div className={`${backdrop ? 'bg-[#191919] rounded-lg border border-[#333] p-6' : ''}`}>
        <LoadingState {...props} />
      </div>
    </div>
  );
};

/**
 * Inline loading component for smaller spaces
 */
export const InlineLoading: React.FC<{ 
  message?: string;
  className?: string;
}> = ({ 
  message = 'Loading...', 
  className = '' 
}) => (
  <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
    <div className="w-4 h-4 animate-spin">
      <svg
        className="w-full h-full text-[#20B2AA]"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
    <span className="text-sm">{message}</span>
  </div>
);

/**
 * Button loading state component
 */
export const ButtonLoading: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}> = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  className = ''
}) => (
  <div className={`flex items-center justify-center gap-2 ${className}`}>
    {isLoading && (
      <div className="w-4 h-4 animate-spin">
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    )}
    <span>{isLoading ? loadingText : children}</span>
  </div>
);

export default LoadingState;