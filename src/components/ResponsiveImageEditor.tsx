import { HtmlImageEditor } from "@/components/HtmlImageEditor";
import { MobileImageEditor } from "@/components/MobileImageEditor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { useResponsive, useResponsiveClasses, useResponsiveCallbacks } from "@/hooks/use-responsive";
import { useEffect, useState } from "react";

interface ResponsiveImageEditorProps {
  className?: string;
  onImageLoad?: (image: HTMLImageElement) => void;
  onTextChange?: (text: string) => void;
  onExport?: (canvas: HTMLCanvasElement) => void;
  onError?: (error: Error, context: string) => void;
  onStatusChange?: (status: string, isProcessing: boolean) => void;
}

/**
 * ResponsiveImageEditor component that conditionally renders mobile or desktop UI
 * based on device type, screen size, and orientation with comprehensive error handling
 */
export const ResponsiveImageEditor: React.FC<ResponsiveImageEditorProps> = (props) => {
  const responsive = useResponsive();
  const classes = useResponsiveClasses();
  const [isClient, setIsClient] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Simple error state for responsive component
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle hydration mismatch by only rendering after client-side mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsInitializing(true);
        
        // Simulate initialization delay for smoother loading
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setIsClient(true);
        setHasError(false);
      } catch (error) {
        console.error('Component initialization failed:', error);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'Component initialization failed');
        if (props.onError) {
          props.onError(error instanceof Error ? error : new Error('Component initialization failed'), 'Component Initialization');
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeComponent();
  }, []);

  // Handle responsive changes with callbacks
  useResponsiveCallbacks({
    onBreakpointChange: (deviceType) => {
      console.log(`Breakpoint changed to: ${deviceType}`);
    },
    onOrientationChange: (orientation) => {
      console.log(`Orientation changed to: ${orientation}`);
    },
    onMobileUIToggle: (useMobileUI) => {
      console.log(`UI mode changed to: ${useMobileUI ? 'mobile' : 'desktop'}`);
    }
  });

  // Handle orientation changes and device detection
  useEffect(() => {
    if (isClient) {
      // Add orientation class to body for CSS targeting
      document.body.classList.remove('orientation-portrait', 'orientation-landscape');
      document.body.classList.add(`orientation-${responsive.orientation}`);
      
      // Add device type class
      document.body.classList.remove('device-mobile-sm', 'device-mobile-md', 'device-tablet', 'device-desktop');
      document.body.classList.add(`device-${responsive.deviceType}`);

      // Add screen size data attributes for debugging and CSS custom properties
      document.documentElement.style.setProperty('--screen-width', `${responsive.screenWidth}px`);
      document.documentElement.style.setProperty('--screen-height', `${responsive.screenHeight}px`);
      document.documentElement.style.setProperty('--device-type', responsive.deviceType);
      document.documentElement.style.setProperty('--orientation', responsive.orientation);
    }

    return () => {
      // Cleanup classes on unmount
      if (isClient) {
        document.body.classList.remove(
          'orientation-portrait', 
          'orientation-landscape',
          'device-mobile-sm', 
          'device-mobile-md', 
          'device-tablet', 
          'device-desktop'
        );
      }
    };
  }, [responsive.deviceType, responsive.orientation, isClient, responsive.screenWidth, responsive.screenHeight]);

  // Show loading state during hydration and initialization
  if (!isClient || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1F2121]">
        <LoadingState
          message={isInitializing ? "Initializing editor..." : "Loading..."}
          size="large"
          variant="spinner"
        />
      </div>
    );
  }

  // Show error state if there's an unrecoverable error
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1F2121] p-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Editor Failed to Load
          </h2>
          <p className="text-gray-400 mb-4">
            {errorMessage || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#20B2AA] hover:bg-[#1a9b94] text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        responsive-image-editor
        ${classes.container}
        ${props.className || ''}
      `}
      data-device-type={responsive.deviceType}
      data-orientation={responsive.orientation}
      data-screen-width={responsive.screenWidth}
      data-screen-height={responsive.screenHeight}
      data-ui-mode={responsive.shouldUseMobileUI ? 'mobile' : 'desktop'}
      data-breakpoint-changed={responsive.breakpointChanged}
    >
      {responsive.shouldUseMobileUI ? (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Mobile editor error:', { error, errorInfo });
            if (props.onError) {
              props.onError(error, 'Mobile Image Editor');
            }
          }}
          fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#1F2121] p-4">
              <div className="max-w-sm text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Mobile Editor Error
                </h3>
                <p className="text-gray-400 mb-4">
                  The mobile interface encountered an error. Try refreshing or switching to desktop view.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#20B2AA] hover:bg-[#1a9b94] text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          }
        >
          <MobileImageEditor 
            {...props}
            data-ui-mode="mobile"
            data-device-type={responsive.deviceType}
            data-orientation={responsive.orientation}
          />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Desktop editor error:', { error, errorInfo });
            if (props.onError) {
              props.onError(error, 'Desktop Image Editor');
            }
          }}
          fallback={
            <div className="flex items-center justify-center min-h-screen bg-[#1F2121] p-4">
              <div className="max-w-md text-center">
                <div className="text-4xl mb-4">🖥️</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Desktop Editor Error
                </h3>
                <p className="text-gray-400 mb-4">
                  The desktop interface encountered an error. Try refreshing or check your browser compatibility.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#20B2AA] hover:bg-[#1a9b94] text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          }
        >
          <HtmlImageEditor 
            {...props}
            data-ui-mode="desktop"
            data-device-type={responsive.deviceType}
            data-orientation={responsive.orientation}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default ResponsiveImageEditor;