import { ResponsiveImageEditor } from "@/components/ResponsiveImageEditor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PricingModal } from "@/components/PricingModal";
import { usePricingModal } from "@/hooks/use-pricing-modal";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Props interface for the Index page component
 * Extends the ResponsiveImageEditor props for proper TypeScript integration
 */
interface IndexPageProps {
  className?: string;
}

/**
 * Mobile-specific props interface for enhanced mobile integration
 */
interface MobileIntegrationProps {
  onImageLoad?: (image: HTMLImageElement) => void;
  onTextChange?: (text: string) => void;
  onExport?: (canvas: HTMLCanvasElement) => void;
  onError?: (error: Error, context: string) => void;
  onStatusChange?: (status: string, isProcessing: boolean) => void;
}

/**
 * Main Index page component that renders the responsive image editor
 * with basic error handling
 */
const Index: React.FC<IndexPageProps> = ({ className }) => {

  // Integration callbacks for mobile UI with basic error handling
  const handleImageLoad = useCallback((image: HTMLImageElement) => {
    try {
      const fileSizeMB = (image.src.length * 0.75 / 1024 / 1024).toFixed(1);
      toast.success("Image loaded successfully", {
        description: `Image dimensions: ${image.width}x${image.height} (${fileSizeMB}MB)`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Image load callback error:', error);
    }
  }, []);

  const handleTextChange = useCallback((text: string) => {
    try {
      // Optional: Show toast for significant text changes
      if (text.length > 0 && text.length % 50 === 0) {
        toast.info("Text updated", {
          description: `Current length: ${text.length} characters`,
          duration: 1500,
        });
      }
    } catch (error) {
      console.error('Text change callback error:', error);
    }
  }, []);

  const handleExport = useCallback((canvas: HTMLCanvasElement) => {
    try {
      // Calculate export details
      const width = canvas.width;
      const height = canvas.height;
      const aspectRatio = (width / height).toFixed(2);
      
      toast.success("Image exported successfully!", {
        description: `Resolution: ${width}x${height} (${aspectRatio}:1)`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Export callback error:', error);
    }
  }, []);

  const handleError = useCallback((error: Error, context: string) => {
    console.error(`Index page error [${context}]:`, error);
    toast.error("Something went wrong", {
      description: error.message || "An unexpected error occurred. Please try again.",
      duration: 5000,
    });
  }, []);

  const handleStatusChange = useCallback((status: string, isProcessing: boolean) => {
    try {
      // Optional: Show toast for important status changes
      if (status.includes("complete") || status.includes("success")) {
        toast.success(status, {
          duration: 2000,
        });
      } else if (status.includes("error") || status.includes("failed")) {
        // Don't show error toast here as it's handled by the error handler
        console.warn('Status change indicates error:', status);
      }
    } catch (error) {
      console.error('Status change callback error:', error);
    }
  }, []);

  // Mobile-specific integration props with enhanced error handling
  const mobileIntegrationProps: MobileIntegrationProps = {
    onImageLoad: handleImageLoad,
    onTextChange: handleTextChange,
    onExport: handleExport,
    onError: handleError,
    onStatusChange: handleStatusChange,
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Index page component error:', { error, errorInfo });
        toast.error("Application Error", {
          description: "The application encountered an unexpected error. Please refresh the page.",
          duration: 8000,
          action: {
            label: 'Refresh Page',
            onClick: () => window.location.reload()
          }
        });
      }}
    >
      <div className={`index-page ${className || ''}`}>
        <ResponsiveImageEditor 
          {...mobileIntegrationProps}
          className="responsive-image-editor-container"
        />
      </div>
    </ErrorBoundary>
  );
};

export default Index;
