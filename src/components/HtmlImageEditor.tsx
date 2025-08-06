import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import styles from "./HtmlImageEditor.module.css";
import { segmentSubject, loadImage, renderTextBehindSubject } from "@/lib/backgroundRemoval";
import { LoadingOverlay, InlineLoading } from "@/components/LoadingState";
import { UpgradeButton } from "@/components/ui/upgrade-button";
import { UserAvatar } from "@/components/UserAvatar";
import { AgentSidebar } from "@/components/AgentSidebar";

// Core TypeScript interfaces for component data models

/**
 * Props interface for the HtmlImageEditor component
 */
interface HtmlImageEditorProps {
  className?: string;
  onImageLoad?: (image: HTMLImageElement) => void;
  onTextChange?: (text: string) => void;
  onExport?: (canvas: HTMLCanvasElement) => void;
  onError?: (error: Error, context: string) => void;
  onStatusChange?: (status: string, isProcessing: boolean) => void;
  // Desktop-specific data attributes
  'data-ui-mode'?: string;
  'data-device-type'?: string;
  'data-orientation'?: string;
}

/**
 * Processing step types for image processing pipeline
 */
type ProcessingStep = 'loading' | 'processing' | 'converting' | 'complete' | 'error';

/**
 * Text position coordinates (percentage-based)
 */
interface TextPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

/**
 * Text styling effects configuration
 */
interface TextEffects {
  blur: number;
  rotation: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

/**
 * Complete text settings configuration
 */
interface TextSettings {
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  position: TextPosition;
  effects: TextEffects;
}

/**
 * Image dimensions and aspect ratio information
 */
interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Canvas viewport transformation state
 */
interface ViewportState {
  zoom: number;
  translateX: number;
  translateY: number;
}

/**
 * Mouse interaction state for canvas operations
 */
interface InteractionState {
  isDragging: boolean;
  lastMousePosition: { x: number; y: number };
}

/**
 * Complete canvas state including image, dimensions, and interactions
 */
interface CanvasState {
  image: HTMLImageElement | null;
  dimensions: ImageDimensions;
  viewport: ViewportState;
  interaction: InteractionState;
}

/**
 * Image processing state with progress tracking
 */
interface ProcessingState {
  isActive: boolean;
  step: ProcessingStep;
  progress: number; // 0-100
  message: string;
  startTime: number;
  duration: number;
  error?: Error;
}

/**
 * UI interaction state for drag and drop operations
 */
interface UIState {
  statusMessage: string;
  isDragOver: boolean;
}

/**
 * Default text settings configuration
 */
const DEFAULT_TEXT_SETTINGS: Omit<TextSettings, 'position'> & { position: TextPosition } = {
  content: "Your text here",
  fontSize: 48,
  fontFamily: "SF Pro Display",
  color: "#ffffff",
  opacity: 80,
  position: { x: 50, y: 50 },
  effects: {
    blur: 3,
    rotation: 0,
    bold: false,
    italic: false,
    underline: false
  }
};

/**
 * Default canvas viewport settings
 */
const DEFAULT_VIEWPORT: ViewportState = {
  zoom: 100,
  translateX: 0,
  translateY: 0
};

/**
 * Supported font families for text rendering with fallbacks
 */
const FONT_FAMILIES = [
  { name: "SF Pro Display", fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { name: "Arial", fallback: "Arial, sans-serif" },
  { name: "Helvetica", fallback: "Helvetica, Arial, sans-serif" },
  { name: "Times New Roman", fallback: "'Times New Roman', Times, serif" },
  { name: "Georgia", fallback: "Georgia, serif" },
  { name: "Verdana", fallback: "Verdana, sans-serif" },
  { name: "Inter", fallback: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" },
  { name: "Roboto", fallback: "Roboto, -apple-system, BlinkMacSystemFont, sans-serif" }
] as const;

/**
 * Font family type derived from the constant array
 */
type FontFamily = typeof FONT_FAMILIES[number]['name'];

/**
 * Zoom level constraints
 */
const ZOOM_CONSTRAINTS = {
  MIN: 10,
  MAX: 500,
  STEP: 10,
  DEFAULT: 100
} as const;

export const HtmlImageEditor: React.FC<HtmlImageEditorProps> = ({
  className = "",
  onImageLoad,
  onTextChange,
  onExport,
  onError,
  onStatusChange,
  'data-ui-mode': uiMode,
  'data-device-type': deviceType,
  'data-orientation': orientation
}) => {
  // Component refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === IMAGE PROCESSING STATE ===
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [imageMask, setImageMask] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('loading');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStartTime, setProcessingStartTime] = useState<number>(0);
  const [processingError, setProcessingError] = useState<Error | undefined>(undefined);

  // === TEXT EDITING STATE ===
  const [textContent, setTextContent] = useState<string>("Your text here");
  const [fontSize, setFontSize] = useState<number>(48);
  const [fontFamily, setFontFamily] = useState<string>("SF Pro Display");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [textOpacity, setTextOpacity] = useState<number>(80);
  const [horizontalPosition, setHorizontalPosition] = useState<number>(50);
  const [verticalPosition, setVerticalPosition] = useState<number>(50);
  const [textRotation, setTextRotation] = useState<number>(0);
  const [depthBlur, setDepthBlur] = useState<number>(3);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);

  // === CANVAS INTERACTION STATE ===
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // === TOUCH INTERACTION STATE ===
  const [touchStartDistance, setTouchStartDistance] = useState<number>(0);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(100);
  const [isPinching, setIsPinching] = useState<boolean>(false);
  const [touchStartPosition, setTouchStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTouchPanning, setIsTouchPanning] = useState<boolean>(false);

  // === UI STATE ===
  const [statusMessage, setStatusMessage] = useState<string>("Ready");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [fontLoadingErrors, setFontLoadingErrors] = useState<Set<string>>(new Set());
  const [statusVisible, setStatusVisible] = useState<boolean>(false);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  
  // === RESPONSIVE STATE ===
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  // === AGENT MODE STATE ===
  const [isAgentModeEnabled, setIsAgentModeEnabled] = useState<boolean>(false);
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  const [isTabletView, setIsTabletView] = useState<boolean>(false);

  // === STATUS MESSAGE UTILITIES ===
  
  /**
   * Show status message with fade-in animation and auto-hide
   */
  const showStatusMessage = useCallback((
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration: number = 3000
  ) => {
    setStatusMessage(message);
    setStatusType(type);
    setStatusVisible(true);
    
    // Call the integration callback if provided
    if (onStatusChange) {
      onStatusChange(message, isProcessing);
    }
    
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        setStatusVisible(false);
        setTimeout(() => {
          if (!isProcessing) {
            setStatusMessage("Ready");
            setStatusType('info');
            if (onStatusChange) {
              onStatusChange("Ready", false);
            }
          }
        }, 300); // Wait for fade-out animation
      }, duration);
    }
  }, [isProcessing, onStatusChange]);

  // === SIMPLE ERROR HANDLING ===
  const handleComponentError = useCallback((error: Error, context: string) => {
    console.error(`HtmlImageEditor error [${context}]:`, error);
    if (onError) {
      onError(error, context);
    }
    setProcessingError(error);
    setProcessingStep('error');
    setIsProcessing(false);
    showStatusMessage(`Error: ${error.message}`, 'error', 5000);
  }, [onError, showStatusMessage]);



  // === DERIVED STATE OBJECTS ===
  
  /**
   * Complete text settings configuration derived from individual state values
   */
  const textSettings: TextSettings = useMemo(() => ({
    content: textContent,
    fontSize: fontSize,
    fontFamily: fontFamily,
    color: textColor,
    opacity: textOpacity,
    position: {
      x: horizontalPosition,
      y: verticalPosition
    },
    effects: {
      blur: depthBlur,
      rotation: textRotation,
      bold: isBold,
      italic: isItalic,
      underline: isUnderline
    }
  }), [textContent, fontSize, fontFamily, textColor, textOpacity, horizontalPosition, verticalPosition, textRotation, depthBlur, isBold, isItalic, isUnderline]);

  /**
   * Complete canvas state derived from individual state values
   */
  const canvasState: CanvasState = useMemo(() => ({
    image: currentImage,
    dimensions: {
      width: currentImage?.naturalWidth || 0,
      height: currentImage?.naturalHeight || 0,
      aspectRatio: currentImage ? currentImage.naturalWidth / currentImage.naturalHeight : 1
    },
    viewport: {
      zoom: zoomLevel,
      translateX: translateX,
      translateY: translateY
    },
    interaction: {
      isDragging: isDragging,
      lastMousePosition: lastMousePosition
    }
  }), [currentImage, zoomLevel, translateX, translateY, isDragging, lastMousePosition]);

  /**
   * Complete processing state derived from individual state values
   */
  const processingState: ProcessingState = useMemo(() => ({
    isActive: isProcessing,
    step: processingStep,
    progress: processingProgress,
    message: statusMessage,
    startTime: processingStartTime,
    duration: processingStartTime > 0 ? Date.now() - processingStartTime : 0,
    error: processingError
  }), [isProcessing, processingStep, processingProgress, statusMessage, processingStartTime, processingError]);

  /**
   * UI state object for drag and drop operations
   */
  const uiState: UIState = useMemo(() => ({
    statusMessage: statusMessage,
    isDragOver: isDragOver
  }), [statusMessage, isDragOver]);

  // === FONT LOADING UTILITY FUNCTIONS ===

  /**
   * Check if a font is available in the system
   */
  const checkFontAvailability = useCallback((fontName: string): boolean => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return false;

    // Test with a fallback font first
    context.font = '12px monospace';
    const fallbackWidth = context.measureText('abcdefghijklmnopqrstuvwxyz').width;

    // Test with the target font
    context.font = `12px "${fontName}", monospace`;
    const testWidth = context.measureText('abcdefghijklmnopqrstuvwxyz').width;

    return testWidth !== fallbackWidth;
  }, []);

  /**
   * Load a font and add it to the loaded fonts set (system fonts only)
   */
  const loadFont = useCallback(async (fontName: string): Promise<boolean> => {
    try {
      // Check if font is already loaded
      if (loadedFonts.has(fontName)) {
        return true;
      }

      // Check if font is available in the system
      if (checkFontAvailability(fontName)) {
        setLoadedFonts(prev => new Set(prev).add(fontName));
        return true;
      }

      // For system fonts, just mark as loaded if it's in our fallback list
      const fontConfig = FONT_FAMILIES.find(f => f.name === fontName);
      if (fontConfig) {
        setLoadedFonts(prev => new Set(prev).add(fontName));
        return true;
      }

      return false;
    } catch (error) {
      console.warn(`Failed to load font: ${fontName}`, error);
      setFontLoadingErrors(prev => new Set(prev).add(fontName));
      return false;
    }
  }, [loadedFonts, checkFontAvailability]);

  /**
   * Get the full font family string with fallbacks
   */
  const getFontFamilyWithFallback = useCallback((fontName: string): string => {
    const fontConfig = FONT_FAMILIES.find(f => f.name === fontName);
    return fontConfig ? `"${fontConfig.name}", ${fontConfig.fallback}` : fontName;
  }, []);

  // === STATE UTILITY FUNCTIONS ===

  /**
   * Get current processing duration in milliseconds
   */
  const getProcessingDuration = useCallback((): number => {
    return processingStartTime > 0 ? Date.now() - processingStartTime : 0;
  }, [processingStartTime]);

  /**
   * Hide status message with fade-out animation
   */
  const hideStatusMessage = useCallback(() => {
    setStatusVisible(false);
    setTimeout(() => {
      if (!isProcessing) {
        setStatusMessage("Ready");
        setStatusType('info');
      }
    }, 300);
  }, [isProcessing]);

  /**
   * Update processing status with enhanced feedback
   */
  const updateProcessingStatus = useCallback((
    step: ProcessingStep,
    progress: number,
    message: string
  ) => {
    setProcessingStep(step);
    setProcessingProgress(progress);
    setStatusMessage(message);
    setStatusVisible(true);
    
    // Set appropriate status type based on step
    switch (step) {
      case 'loading':
        setStatusType('info');
        break;
      case 'processing':
        setStatusType('info');
        break;
      case 'converting':
        setStatusType('info');
        break;
      case 'complete':
        setStatusType('success');
        break;
      case 'error':
        setStatusType('error');
        break;
      default:
        setStatusType('info');
    }
  }, []);

  /**
   * Check if zoom level is at minimum
   */
  const isZoomAtMin = useCallback((): boolean => {
    return zoomLevel <= ZOOM_CONSTRAINTS.MIN;
  }, [zoomLevel]);

  /**
   * Check if zoom level is at maximum
   */
  const isZoomAtMax = useCallback((): boolean => {
    return zoomLevel >= ZOOM_CONSTRAINTS.MAX;
  }, [zoomLevel]);

  /**
   * Validate and clamp zoom level within constraints
   */
  const clampZoomLevel = useCallback((zoom: number): number => {
    return Math.max(ZOOM_CONSTRAINTS.MIN, Math.min(ZOOM_CONSTRAINTS.MAX, zoom));
  }, []);

  /**
   * Check if image is currently loaded
   */
  const hasImage = useCallback((): boolean => {
    return currentImage !== null;
  }, [currentImage]);

  // === TOUCH HANDLING UTILITIES ===

  /**
   * Calculate distance between two touch points
   */
  const getTouchDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Get center point between two touches
   */
  const getTouchCenter = useCallback((touch1: Touch, touch2: Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }, []);

  /**
   * Detect if device supports touch
   */
  const isTouchDevice = useCallback((): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  /**
   * Constrain zoom level within bounds
   */
  const constrainZoom = useCallback((zoom: number): number => {
    return Math.max(ZOOM_CONSTRAINTS.MIN, Math.min(ZOOM_CONSTRAINTS.MAX, zoom));
  }, []);

  /**
   * Get current text settings as a complete object
   */
  const getCurrentTextSettings = useCallback((): TextSettings => {
    return textSettings;
  }, [textSettings]);

  /**
   * Get current canvas state as a complete object
   */
  const getCurrentCanvasState = useCallback((): CanvasState => {
    return canvasState;
  }, [canvasState]);

  /**
   * Get current processing state as a complete object
   */
  const getCurrentProcessingState = useCallback((): ProcessingState => {
    return processingState;
  }, [processingState]);

  // === EXPORT HANDLER ===

  /**
   * Create high-quality export canvas that matches the display exactly
   * This generates the final image at original resolution without zoom/pan transformations
   */
  const createExportCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!processedCanvas || !imageMask) {
      console.warn('Cannot create export canvas: missing processed canvas or mask');
      return null;
    }

    try {
      // Create text options for export using current settings
      const exportTextOptions = {
        fontSize: fontSize,
        fontFamily: getFontFamilyWithFallback(fontFamily),
        color: textColor,
        opacity: textOpacity,
        x: (horizontalPosition / 100) * processedCanvas.width,
        y: (verticalPosition / 100) * processedCanvas.height,
        rotation: textRotation,
        blur: depthBlur,
        bold: isBold,
        italic: isItalic,
        underline: isUnderline
      };

      // Generate the final high-quality canvas using the same rendering pipeline
      const exportCanvas = renderTextBehindSubject(
        processedCanvas,
        imageMask,
        textContent,
        exportTextOptions,
        currentImage
      );

      return exportCanvas;
    } catch (error) {
      console.error('Error creating export canvas:', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error as Error, 'Export Canvas Creation');
      }
      
      return null;
    }
  }, [
    processedCanvas, 
    imageMask, 
    fontSize, 
    fontFamily, 
    textColor, 
    textOpacity, 
    horizontalPosition, 
    verticalPosition, 
    depthBlur, 
    isBold, 
    isItalic, 
    isUnderline, 
    textContent, 
    getFontFamilyWithFallback,
    onError
  ]);

  /**
   * Generate proper filename with timestamp and user-friendly naming
   */
  const generateExportFilename = useCallback((): string => {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const textPreview = textContent.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
    return `text-behind-image_${textPreview}_${timestamp}.png`;
  }, [textContent]);

  /**
   * Check if export is ready and validate all required components
   */
  const isExportReady = useCallback((): { ready: boolean; reason?: string } => {
    if (!currentImage) {
      return { ready: false, reason: "No image loaded" };
    }
    
    if (!processedCanvas) {
      return { ready: false, reason: "Image not processed yet" };
    }
    
    if (!imageMask) {
      return { ready: false, reason: "Image mask not available" };
    }
    
    if (isProcessing) {
      return { ready: false, reason: "Image processing in progress" };
    }
    
    if (!textContent.trim()) {
      return { ready: false, reason: "No text content to render" };
    }
    
    return { ready: true };
  }, [currentImage, processedCanvas, imageMask, isProcessing, textContent]);

  /**
   * Get export information for display purposes
   */
  const getExportInfo = useCallback((): { 
    dimensions?: { width: number; height: number }; 
    estimatedSize?: string;
    ready: boolean;
  } => {
    const exportCheck = isExportReady();
    
    if (!exportCheck.ready || !processedCanvas) {
      return { ready: false };
    }
    
    // Calculate estimated file size (rough approximation)
    const pixels = processedCanvas.width * processedCanvas.height;
    const estimatedBytes = pixels * 4; // 4 bytes per pixel for RGBA
    const estimatedMB = (estimatedBytes / (1024 * 1024)).toFixed(1);
    
    return {
      dimensions: {
        width: processedCanvas.width,
        height: processedCanvas.height
      },
      estimatedSize: `~${estimatedMB}MB`,
      ready: true
    };
  }, [isExportReady, processedCanvas]);

  /**
   * Get export button tooltip with current status
   */
  const getExportTooltip = useCallback((): string => {
    const exportCheck = isExportReady();
    
    if (!exportCheck.ready) {
      return `Cannot export: ${exportCheck.reason}`;
    }
    
    const info = getExportInfo();
    if (info.ready && info.dimensions) {
      return `Export high-quality image (${info.dimensions.width}×${info.dimensions.height}, ${info.estimatedSize}) - Ctrl+S`;
    }
    
    return "Export image (Ctrl+S)";
  }, [isExportReady, getExportInfo]);

  /**
   * Handle high-quality image export functionality with progress feedback
   * Exports the original resolution image without display transformations
   */
  const handleExport = useCallback(async () => {
    // Validate export readiness
    const exportCheck = isExportReady();
    if (!exportCheck.ready) {
      showStatusMessage(`Cannot export: ${exportCheck.reason}`, 'warning', 3000);
      return;
    }
    
    try {
      showStatusMessage("Preparing high-quality export...", 'info', 0);
      
      // Add micro-animation to export buttons
      const exportButtons = document.querySelectorAll('[title="Export image"], .exportButton');
      exportButtons.forEach(button => {
        button.classList.add(styles.microGlow);
        setTimeout(() => button.classList.remove(styles.microGlow), 600);
      });
      
      // Show progress for canvas creation
      showStatusMessage("Generating high-quality canvas...", 'info', 0);
      
      // Create high-quality export canvas
      const exportCanvas = createExportCanvas();
      if (!exportCanvas) {
        showStatusMessage("Failed to create export canvas", 'error', 3000);
        return;
      }

      // Show progress for file generation
      showStatusMessage("Converting to image file...", 'info', 0);

      // Generate proper filename
      const filename = generateExportFilename();
      
      // Export with maximum quality using Promise wrapper for better error handling
      const exportPromise = new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      const blob = await exportPromise;
      
      if (blob) {
        showStatusMessage("Downloading image...", 'info', 0);
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up object URL
        URL.revokeObjectURL(url);
        
        // Show success message with detailed file info
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(1);
        const exportInfo = getExportInfo();
        
        showStatusMessage(
          `Export complete! ${exportCanvas.width}×${exportCanvas.height} (${fileSizeMB}MB)`, 
          'success', 
          4000
        );
        
        console.log(`Export completed successfully:`, {
          filename,
          dimensions: `${exportCanvas.width}×${exportCanvas.height}`,
          fileSize: `${fileSizeMB}MB`,
          quality: 'Maximum (PNG)',
          timestamp: new Date().toISOString()
        });
      } else {
        showStatusMessage("Failed to generate image file", 'error', 3000);
      }
      
      // Call optional export callback with the high-quality canvas
      if (onExport) {
        onExport(exportCanvas);
      }
    } catch (error) {
      console.error('Export error:', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error as Error, 'Image Export');
      }
      
      showStatusMessage("Export failed. Please try again.", 'error', 3000);
    }
  }, [
    isExportReady,
    createExportCanvas, 
    generateExportFilename,
    getExportInfo,
    onExport, 
    onError,
    showStatusMessage
  ]);

  // === COMPONENT LIFECYCLE FUNCTIONS ===

  /**
   * Initialize component with default state and event listeners
   */
  const initializeComponent = useCallback(() => {
    console.log('HtmlImageEditor component initialized');
    setStatusMessage("Ready");
  }, []);

  /**
   * Cleanup component resources and event listeners
   */
  const cleanupComponent = useCallback(() => {
    console.log('HtmlImageEditor component cleanup');
    // Reset processing state on cleanup
    setIsProcessing(false);
    setProcessingError(undefined);
  }, []);

  // === TEXT STYLING HANDLERS ===

  /**
   * Toggle text bold style with feedback
   */
  const toggleBold = useCallback(() => {
    setIsBold(prev => {
      const newValue = !prev;
      showStatusMessage(newValue ? "Bold enabled" : "Bold disabled", 'info', 800);
      
      // Add micro-animation to the button
      const boldButton = document.querySelector('[title="Bold"]');
      if (boldButton) {
        boldButton.classList.add(styles.microBounce);
        setTimeout(() => boldButton.classList.remove(styles.microBounce), 300);
      }
      
      return newValue;
    });
  }, [showStatusMessage]);

  /**
   * Toggle text italic style with feedback
   */
  const toggleItalic = useCallback(() => {
    setIsItalic(prev => {
      const newValue = !prev;
      showStatusMessage(newValue ? "Italic enabled" : "Italic disabled", 'info', 800);
      
      // Add micro-animation to the button
      const italicButton = document.querySelector('[title="Italic"]');
      if (italicButton) {
        italicButton.classList.add(styles.microBounce);
        setTimeout(() => italicButton.classList.remove(styles.microBounce), 300);
      }
      
      return newValue;
    });
  }, [showStatusMessage]);

  /**
   * Toggle text underline style with feedback
   */
  const toggleUnderline = useCallback(() => {
    setIsUnderline(prev => {
      const newValue = !prev;
      showStatusMessage(newValue ? "Underline enabled" : "Underline disabled", 'info', 800);
      
      // Add micro-animation to the button
      const underlineButton = document.querySelector('[title="Underline"]');
      if (underlineButton) {
        underlineButton.classList.add(styles.microBounce);
        setTimeout(() => underlineButton.classList.remove(styles.microBounce), 300);
      }
      
      return newValue;
    });
  }, [showStatusMessage]);



  // === KEYBOARD SHORTCUTS AND ACCESSIBILITY ===

  /**
   * Handle keyboard shortcuts for accessibility
   */
  const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    // Check for Ctrl/Cmd key combinations
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          toggleBold();
          break;
        case 'i':
          e.preventDefault();
          toggleItalic();
          break;
        case 'u':
          e.preventDefault();
          toggleUnderline();
          break;
        case 's':
          e.preventDefault();
          handleExport(); // Now includes its own validation
          break;
        case 'o':
          e.preventDefault();
          fileInputRef.current?.click();
          break;
        default:
          break;
      }
    }
  }, [toggleBold, toggleItalic, toggleUnderline, handleExport]);

  // === TOUCH EVENT HANDLERS ===

  /**
   * Handle touch start for canvas interactions
   */
  const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
    if (!currentImage) return;

    const touches = e.touches;
    
    if (touches.length === 1) {
      // Single touch - prepare for panning
      const touch = touches[0];
      setTouchStartPosition({
        x: touch.clientX,
        y: touch.clientY
      });
      setIsTouchPanning(false);
      setIsPinching(false);
    } else if (touches.length === 2) {
      // Two touches - start pinch zoom
      const distance = getTouchDistance(touches[0], touches[1]);
      setTouchStartDistance(distance);
      setTouchStartZoom(zoomLevel);
      setIsPinching(true);
      setIsTouchPanning(false);
      setTouchStartPosition(null);
      
      // Prevent default to avoid scrolling
      e.preventDefault();
    }
  }, [currentImage, zoomLevel, getTouchDistance]);

  /**
   * Handle touch move for canvas interactions
   */
  const handleCanvasTouchMove = useCallback((e: React.TouchEvent) => {
    if (!currentImage) return;

    const touches = e.touches;

    if (touches.length === 1 && touchStartPosition && !isPinching) {
      // Single touch panning
      const touch = touches[0];
      const deltaX = touch.clientX - touchStartPosition.x;
      const deltaY = touch.clientY - touchStartPosition.y;
      
      // Only start panning if moved more than threshold
      if (!isTouchPanning && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        setIsTouchPanning(true);
      }
      
      if (isTouchPanning) {
        setTranslateX(prev => prev + deltaX * 0.5);
        setTranslateY(prev => prev + deltaY * 0.5);
        
        setTouchStartPosition({
          x: touch.clientX,
          y: touch.clientY
        });
        
        e.preventDefault();
      }
    } else if (touches.length === 2 && isPinching) {
      // Two touch pinch-to-zoom
      const distance = getTouchDistance(touches[0], touches[1]);
      const scale = distance / touchStartDistance;
      const newZoom = constrainZoom(touchStartZoom * scale);
      
      // Only update if zoom changed significantly
      if (Math.abs(newZoom - zoomLevel) > 2) {
        setZoomLevel(newZoom);
      }
      
      e.preventDefault();
    }
  }, [
    currentImage,
    touchStartPosition,
    isPinching,
    isTouchPanning,
    zoomLevel,
    touchStartZoom,
    touchStartDistance,
    getTouchDistance,
    constrainZoom
  ]);

  /**
   * Handle touch end for canvas interactions
   */
  const handleCanvasTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // All touches ended
      setTouchStartPosition(null);
      setIsTouchPanning(false);
      setIsPinching(false);
      setTouchStartDistance(0);
      setTouchStartZoom(100);
    } else if (e.touches.length === 1 && isPinching) {
      // Went from pinch to single touch
      const touch = e.touches[0];
      setTouchStartPosition({
        x: touch.clientX,
        y: touch.clientY
      });
      setIsPinching(false);
      setIsTouchPanning(false);
    }
  }, [isPinching]);

  // === RESPONSIVE UTILITIES ===

  /**
   * Update responsive state based on screen size
   */
  const updateResponsiveState = useCallback(() => {
    const width = window.innerWidth;
    setScreenWidth(width);
    setIsMobileView(width < 768);
    setIsTabletView(width >= 768 && width < 1024);
    
    // Auto-collapse sidebar on mobile and tablet portrait
    if (width < 1024) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, []);

  /**
   * Toggle sidebar visibility
   */
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
    showStatusMessage(sidebarCollapsed ? "Sidebar opened" : "Sidebar closed", 'info', 1000);
  }, [sidebarCollapsed, showStatusMessage]);

  /**
   * Handle window resize for responsive behavior
   */
  const handleWindowResize = useCallback(() => {
    updateResponsiveState();
  }, [updateResponsiveState]);

  // === COMPONENT LIFECYCLE EFFECTS ===
  
  /**
   * Component initialization effect
   */
  useEffect(() => {
    initializeComponent();
    updateResponsiveState();
    
    // Initialize status visibility
    setStatusVisible(true);
    
    // Add keyboard event listeners for accessibility
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Initialize system fonts
    const initializeFonts = () => {
      const systemFonts = ['SF Pro Display', 'Arial', 'Helvetica', 'Inter', 'Roboto'];
      systemFonts.forEach(fontName => {
        if (checkFontAvailability(fontName)) {
          setLoadedFonts(prev => new Set(prev).add(fontName));
        }
      });
    };
    
    initializeFonts();
    
    return () => {
      cleanupComponent();
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [initializeComponent, cleanupComponent, loadFont, handleKeyboardShortcuts, updateResponsiveState]);

  /**
   * Window resize listener for responsive behavior
   */
  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [handleWindowResize]);

  /**
   * Enhanced touch handling for better mobile experience
   */
  useEffect(() => {
    const viewport = containerRef.current?.querySelector('.viewport');
    if (!viewport) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent default pinch behavior
      }
      viewport.classList.add('touchActive');
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        viewport.classList.remove('touchActive', 'pinching', 'panning');
      }
    };

    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);

    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  /**
   * Text change callback effect
   */
  useEffect(() => {
    if (onTextChange) {
      onTextChange(textContent);
    }
  }, [textContent, onTextChange]);

  /**
   * Image load callback effect
   */
  useEffect(() => {
    if (currentImage && onImageLoad) {
      onImageLoad(currentImage);
    }
  }, [currentImage, onImageLoad]);

  /**
   * Processing state tracking effect
   */
  useEffect(() => {
    if (isProcessing && processingStartTime === 0) {
      setProcessingStartTime(Date.now());
    } else if (!isProcessing && processingStartTime > 0) {
      setProcessingStartTime(0);
    }
  }, [isProcessing, processingStartTime]);

  // === CANVAS RENDERING FUNCTIONS ===

  /**
   * Calculate optimal canvas dimensions while maintaining aspect ratio
   */
  const calculateCanvasDimensions = useCallback((
    imageWidth: number, 
    imageHeight: number, 
    containerWidth: number, 
    containerHeight: number
  ): { width: number; height: number; scale: number } => {
    const imageAspectRatio = imageWidth / imageHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let displayWidth: number;
    let displayHeight: number;
    let scale: number;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container - fit to width
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
      scale = containerWidth / imageWidth;
    } else {
      // Image is taller than container - fit to height
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
      scale = containerHeight / imageHeight;
    }
    
    return {
      width: Math.floor(displayWidth),
      height: Math.floor(displayHeight),
      scale
    };
  }, []);

  /**
   * Render image with proper aspect ratio fitting and zoom/pan transformations
   */
  const renderCanvasImage = useCallback((
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement
  ) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx || !containerRef.current) return;

    // Get viewport container dimensions
    const viewportElement = containerRef.current.querySelector(`.${styles.viewport}`) as HTMLElement;
    if (!viewportElement) return;

    const containerRect = viewportElement.getBoundingClientRect();
    const maxWidth = containerRect.width - 48; // Account for padding
    const maxHeight = containerRect.height - 48;

    // Calculate optimal display dimensions
    const dimensions = calculateCanvasDimensions(
      sourceCanvas.width,
      sourceCanvas.height,
      maxWidth,
      maxHeight
    );

    // Set canvas size to display dimensions
    targetCanvas.width = dimensions.width;
    targetCanvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    // Apply zoom and pan transformations
    ctx.save();
    
    // Apply zoom from center
    const centerX = targetCanvas.width / 2;
    const centerY = targetCanvas.height / 2;
    const zoomScale = zoomLevel / 100;
    
    ctx.translate(centerX, centerY);
    ctx.scale(zoomScale, zoomScale);
    ctx.translate(-centerX + translateX, -centerY + translateY);

    // Draw the source canvas with proper scaling
    ctx.drawImage(
      sourceCanvas,
      0, 0, sourceCanvas.width, sourceCanvas.height,
      0, 0, targetCanvas.width, targetCanvas.height
    );

    ctx.restore();
  }, [calculateCanvasDimensions, zoomLevel, translateX, translateY]);

  /**
   * Create text overlay canvas with all styling properties
   */
  const createTextOverlay = useCallback((
    width: number,
    height: number,
    textSettings: TextSettings
  ): HTMLCanvasElement => {
    const textCanvas = document.createElement('canvas');
    textCanvas.width = width;
    textCanvas.height = height;
    
    const ctx = textCanvas.getContext('2d');
    if (!ctx) return textCanvas;

    // Configure text rendering context
    let fontStyle = '';
    if (textSettings.effects.italic) fontStyle += 'italic ';
    if (textSettings.effects.bold) fontStyle += 'bold ';

    ctx.font = `${fontStyle}${textSettings.fontSize}px ${textSettings.fontFamily}`;
    ctx.fillStyle = textSettings.color;
    ctx.globalAlpha = textSettings.opacity / 100;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Apply blur effect if specified
    if (textSettings.effects.blur > 0) {
      ctx.filter = `blur(${textSettings.effects.blur}px)`;
    }

    // Calculate text position based on percentage
    const textX = (textSettings.position.x / 100) * width;
    const textY = (textSettings.position.y / 100) * height;

    // Apply rotation if specified
    if (textSettings.effects.rotation !== 0) {
      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate((textSettings.effects.rotation * Math.PI) / 180);
      ctx.translate(-textX, -textY);
    }

    // Draw text
    ctx.fillText(textSettings.content, textX, textY);

    // Add underline if needed
    if (textSettings.effects.underline) {
      const textMetrics = ctx.measureText(textSettings.content);
      const textWidth = textMetrics.width;
      const underlineY = textY + textSettings.fontSize * 0.1;
    
      ctx.strokeStyle = textSettings.color;
      ctx.lineWidth = Math.max(1, textSettings.fontSize * 0.05);
      ctx.beginPath();
      ctx.moveTo(textX - textWidth / 2, underlineY);
      ctx.lineTo(textX + textWidth / 2, underlineY);
      ctx.stroke();
    }

    // Restore context if rotation was applied
    if (textSettings.effects.rotation !== 0) {
      ctx.restore();
    }

    return textCanvas;
  }, []);

  /**
   * Composite layers with proper z-index management for text-behind-image effect
   */
  const compositeImageLayers = useCallback((
    backgroundCanvas: HTMLCanvasElement,
    textCanvas: HTMLCanvasElement,
    subjectCanvas: HTMLCanvasElement,
    outputCanvas: HTMLCanvasElement
  ) => {
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    // Set output canvas dimensions
    outputCanvas.width = backgroundCanvas.width;
    outputCanvas.height = backgroundCanvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

    // Layer 1 (bottom): Background - original image with subject removed
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(backgroundCanvas, 0, 0);
    
    // Layer 2 (middle): Text overlay - positioned behind subject
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(textCanvas, 0, 0);
    
    // Layer 3 (top): Subject - foreground elements that appear in front of text
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(subjectCanvas, 0, 0);
  }, []);

  /**
   * Re-render text with current settings when text properties change
   */
  const updateTextRendering = useCallback(() => {
    if (!processedCanvas || !imageMask || !canvasRef.current) {
      return;
    }
    
    try {
      const textOptions = {
        fontSize: fontSize,
        fontFamily: getFontFamilyWithFallback(fontFamily),
        color: textColor,
        opacity: textOpacity,
        x: (horizontalPosition / 100) * processedCanvas.width,
        y: (verticalPosition / 100) * processedCanvas.height,
        rotation: textRotation,
        blur: depthBlur,
        bold: isBold,
        italic: isItalic,
        underline: isUnderline
      };
      
      const finalCanvas = renderTextBehindSubject(
        processedCanvas,
        imageMask,
        textContent,
        textOptions,
        currentImage
      );
      
      // Render the final canvas with proper aspect ratio fitting
      renderCanvasImage(finalCanvas, canvasRef.current);
      
    } catch (error) {
      console.error('Text rendering error:', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error as Error, 'Text Rendering');
      }
      
      showStatusMessage("Error updating text. Please try again.", 'error', 3000);
    }
  }, [processedCanvas, imageMask, fontSize, fontFamily, textColor, textOpacity, horizontalPosition, verticalPosition, textRotation, depthBlur, isBold, isItalic, isUnderline, textContent, getFontFamilyWithFallback, renderCanvasImage, onError, showStatusMessage]);

  /**
   * Text rendering update effect - re-render when text settings change
   */
  useEffect(() => {
    if (processedCanvas && imageMask && !isProcessing) {
      updateTextRendering();
    }
  }, [updateTextRendering, processedCanvas, imageMask, isProcessing]);

  /**
   * Viewport resize observer effect - re-render canvas when viewport size changes
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize events to avoid excessive re-renders
      const timeoutId = setTimeout(() => {
        if (processedCanvas && imageMask && canvasRef.current && !isProcessing) {
          updateTextRendering();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    });

    const viewportElement = containerRef.current.querySelector(`.${styles.viewport}`) as HTMLElement;
    if (viewportElement) {
      resizeObserver.observe(viewportElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [processedCanvas, imageMask, isProcessing, updateTextRendering]);

  // === FILE HANDLING FUNCTIONS ===

  /**
   * Validate if file is a supported image type
   */
  const validateImageFile = useCallback((file: File): boolean => {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    return supportedTypes.includes(file.type.toLowerCase());
  }, []);

  /**
   * Get file size in human readable format
   */
  const getFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  /**
   * Process image with simplified error handling
   */
  const processImageFile = useCallback(async (file: File) => {
    try {
      // Step 1: Load image using background removal service
      updateProcessingStatus('loading', 10, "Validating image format...");
      
      const img = await loadImage(file);
      setCurrentImage(img);
      updateProcessingStatus('loading', 25, `Image loaded: ${img.naturalWidth}×${img.naturalHeight}px`);
      
      // Step 2: Process image with AI background removal
      updateProcessingStatus('processing', 25, "Initializing AI background removal...");
      
      const segmentResult = await segmentSubject(img, (step: string, progress: number) => {
        // Update progress based on AI processing steps
        const baseProgress = 25; // Already completed loading
        const aiProgress = Math.floor((progress / 100) * 60); // AI takes 60% of total progress
        updateProcessingStatus('processing', baseProgress + aiProgress, step);
      });
      
      // Store the processed results
      setProcessedCanvas(segmentResult.canvas);
      setImageMask(segmentResult.mask);
      updateProcessingStatus('processing', 90, "AI processing complete - preparing render...");
      
      // Step 3: Render initial text behind subject
      updateProcessingStatus('converting', 90, "Rendering text overlay...");
      
      const textOptions = {
        fontSize: fontSize,
        fontFamily: getFontFamilyWithFallback(fontFamily),
        color: textColor,
        opacity: textOpacity,
        x: (horizontalPosition / 100) * segmentResult.canvas.width,
        y: (verticalPosition / 100) * segmentResult.canvas.height,
        rotation: textRotation,
        blur: depthBlur,
        bold: isBold,
        italic: isItalic,
        underline: isUnderline
      };
      
      const finalCanvas = renderTextBehindSubject(
        segmentResult.canvas,
        segmentResult.mask,
        textContent,
        textOptions,
        currentImage
      );
      
      // Update canvas display with proper aspect ratio fitting
      if (canvasRef.current) {
        renderCanvasImage(finalCanvas, canvasRef.current);
      }
      
      updateProcessingStatus('complete', 100, "Processing complete!");
      
      // Show success message and auto-hide with animation
      setTimeout(() => {
        showStatusMessage("Image ready for editing", 'success', 2000);
        
        // Canvas animation removed to prevent unwanted pop effects
      }, 500);
      
      // Call success callback if provided
      if (onImageLoad) {
        onImageLoad(img);
      }
      
      return { img, segmentResult, finalCanvas };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Image processing failed');
      handleComponentError(errorObj, 'Image Processing');
      throw errorObj;
    }
  }, [
    updateProcessingStatus,
    fontSize,
    fontFamily,
    getFontFamilyWithFallback,
    textColor,
    textOpacity,
    horizontalPosition,
    verticalPosition,
    textRotation,
    depthBlur,
    isBold,
    isItalic,
    isUnderline,
    textContent,
    renderCanvasImage,
    showStatusMessage,
    onImageLoad,
    handleComponentError
  ]);

  /**
   * Handle file upload with validation and error handling
   */
  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file type
    if (!validateImageFile(file)) {
      const error = new Error("Please select a valid image file (JPG, PNG, WebP, GIF)");
      handleComponentError(error, 'File Validation');
      return;
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const error = new Error(
        `File too large (${getFileSize(file.size)}). Maximum size is 10MB.`
      );
      handleComponentError(error, 'File Size Validation');
      return;
    }

    // Start processing
    setIsProcessing(true);
    setProcessingError(undefined);
    updateProcessingStatus('loading', 0, `Loading ${file.name}...`);
    
    try {
      await processImageFile(file);
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    validateImageFile, 
    getFileSize, 
    handleComponentError,
    processImageFile,
    updateProcessingStatus
  ]);

  // === DRAG AND DROP HANDLERS ===

  /**
   * Handle drag enter event to prevent default and set drag state
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if dragged items contain files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  /**
   * Handle drag over event with visual feedback
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure drag over state is maintained
    if (!isDragOver && e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, [isDragOver]);

  /**
   * Handle drag leave event with proper boundary detection
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only remove drag state if leaving the viewport container
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  /**
   * Handle file drop with comprehensive validation and feedback
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
      showStatusMessage("No files detected. Please try again.", 'warning', 3000);
      return;
    }
    
    if (files.length > 1) {
      showStatusMessage("Please drop only one image file at a time.", 'warning', 3000);
      return;
    }
    
    const file = files[0];
    
    // Validate file type before processing
    if (!validateImageFile(file)) {
      showStatusMessage(`"${file.name}" is not a supported image format. Please use JPG, PNG, WebP, or GIF.`, 'error', 4000);
      return;
    }
    
    // Process the valid image file
    handleFileUpload(file);
  }, [handleFileUpload, validateImageFile, showStatusMessage]);

  // === TEXT EDITING HANDLERS ===

  /**
   * Handle text content changes with real-time updates
   */
  const handleTextContentChange = useCallback((newText: string) => {
    setTextContent(newText);
    
    // Canvas micro-animation removed to prevent unwanted glow effects during text changes
    
    // Provide immediate feedback for text changes
    if (newText.trim() === '') {
      showStatusMessage("Enter text to see preview", 'info', 1500);
    } else {
      const displayText = newText.length > 20 ? newText.substring(0, 20) + '...' : newText;
      showStatusMessage(`Text updated: "${displayText}"`, 'info', 1000);
    }
  }, [showStatusMessage]);

  /**
   * Handle font size changes with validation and feedback
   */
  const handleFontSizeChange = useCallback((newSize: number) => {
    // Validate and clamp font size
    const clampedSize = Math.max(8, Math.min(200, newSize));
    setFontSize(clampedSize);
    
    if (clampedSize !== newSize) {
      showStatusMessage(`Font size clamped to ${clampedSize}px (range: 8-200px)`, 'warning', 2000);
    } else {
      showStatusMessage(`Font size: ${clampedSize}px`, 'info', 800);
    }
  }, [showStatusMessage]);

  /**
   * Handle font family changes with font loading
   */
  const handleFontFamilyChange = useCallback(async (newFamily: string) => {
    setFontFamily(newFamily);
    
    // Load the font if it's not already loaded
    if (!loadedFonts.has(newFamily)) {
      showStatusMessage(`Loading font: ${newFamily}...`, 'info', 0); // Don't auto-hide while loading
      const loaded = await loadFont(newFamily);
      if (loaded) {
        showStatusMessage(`Font loaded: ${newFamily}`, 'success', 1500);
      } else {
        showStatusMessage(`Using fallback for: ${newFamily}`, 'warning', 2000);
      }
    } else {
      showStatusMessage(`Font changed to: ${newFamily}`, 'info', 1000);
    }
  }, [loadedFonts, loadFont, showStatusMessage]);

  /**
   * Handle text color changes with feedback
   */
  const handleTextColorChange = useCallback((newColor: string) => {
    setTextColor(newColor);
    showStatusMessage(`Color changed to ${newColor.toUpperCase()}`, 'info', 800);
  }, [showStatusMessage]);

  /**
   * Handle zoom level changes with proper clamping
   */
  const handleZoomChange = useCallback((newZoom: number) => {
    const clampedZoom = clampZoomLevel(newZoom);
    setZoomLevel(clampedZoom);
    
    // Update cursor based on zoom level
    if (canvasRef.current) {
      canvasRef.current.style.cursor = clampedZoom > 100 ? 'grab' : 'default';
    }
    
    // Re-render canvas with new zoom level
    if (processedCanvas && imageMask && canvasRef.current) {
      updateTextRendering();
    }
  }, [clampZoomLevel, processedCanvas, imageMask, updateTextRendering]);

  // === CANVAS INTERACTION HANDLERS ===

  /**
   * Handle mouse wheel zoom on canvas with Ctrl+scroll
   */
  const handleCanvasWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // Only zoom when Ctrl key is held
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate zoom delta based on wheel direction
    const zoomDelta = e.deltaY > 0 ? -ZOOM_CONSTRAINTS.STEP : ZOOM_CONSTRAINTS.STEP;
    const newZoom = clampZoomLevel(zoomLevel + zoomDelta);
    
    // Update zoom level
    handleZoomChange(newZoom);
  }, [zoomLevel, clampZoomLevel, handleZoomChange]);

  /**
   * Handle mouse down for pan start
   */
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (zoomLevel <= 100) return; // Only allow panning when zoomed in
    
    setIsDragging(true);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
    
    // Change cursor to grabbing
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
    }
  }, [zoomLevel]);

  /**
   * Handle mouse move for panning
   */
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || zoomLevel <= 100) return;
    
    const deltaX = e.clientX - lastMousePosition.x;
    const deltaY = e.clientY - lastMousePosition.y;
    
    setTranslateX(prev => prev + deltaX);
    setTranslateY(prev => prev + deltaY);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
    
    // Re-render canvas with new pan position
    if (processedCanvas && imageMask && canvasRef.current) {
      updateTextRendering();
    }
  }, [isDragging, lastMousePosition, zoomLevel, processedCanvas, imageMask, updateTextRendering]);

  /**
   * Handle mouse up for pan end
   */
  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // Reset cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = zoomLevel > 100 ? 'grab' : 'default';
    }
  }, [zoomLevel]);

  /**
   * Handle mouse leave to end panning
   */
  const handleCanvasMouseLeave = useCallback(() => {
    setIsDragging(false);
    
    // Reset cursor
    if (canvasRef.current) {
      canvasRef.current.style.cursor = zoomLevel > 100 ? 'grab' : 'default';
    }
  }, [zoomLevel]);

  /**
   * Zoom in by step amount
   */
  const zoomIn = useCallback(() => {
    handleZoomChange(zoomLevel + ZOOM_CONSTRAINTS.STEP);
  }, [zoomLevel, handleZoomChange]);

  /**
   * Zoom out by step amount
   */
  const zoomOut = useCallback(() => {
    handleZoomChange(zoomLevel - ZOOM_CONSTRAINTS.STEP);
  }, [zoomLevel, handleZoomChange]);

  /**
   * Reset canvas view to default state
   */
  const resetCanvasView = useCallback(() => {
    setZoomLevel(DEFAULT_VIEWPORT.zoom);
    setTranslateX(DEFAULT_VIEWPORT.translateX);
    setTranslateY(DEFAULT_VIEWPORT.translateY);
  }, []);

  /**
   * Reset all text settings to defaults
   */
  const resetTextSettings = useCallback(() => {
    setTextContent(DEFAULT_TEXT_SETTINGS.content);
    setFontSize(DEFAULT_TEXT_SETTINGS.fontSize);
    setFontFamily(DEFAULT_TEXT_SETTINGS.fontFamily);
    setTextColor(DEFAULT_TEXT_SETTINGS.color);
    setTextOpacity(DEFAULT_TEXT_SETTINGS.opacity);
    setHorizontalPosition(DEFAULT_TEXT_SETTINGS.position.x);
    setVerticalPosition(DEFAULT_TEXT_SETTINGS.position.y);
    setTextRotation(DEFAULT_TEXT_SETTINGS.effects.rotation);
    setDepthBlur(DEFAULT_TEXT_SETTINGS.effects.blur);
    setIsBold(DEFAULT_TEXT_SETTINGS.effects.bold);
    setIsItalic(DEFAULT_TEXT_SETTINGS.effects.italic);
    setIsUnderline(DEFAULT_TEXT_SETTINGS.effects.underline);
    showStatusMessage("Text settings reset to defaults", 'success', 2000);
  }, [showStatusMessage]);



  // Render complete HTML structure with CSS module styling
  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${className} ${sidebarCollapsed ? styles.sidebarCollapsed : ''} ${isAgentModeEnabled ? styles.agentSidebarOpen : ''} ${isMobileView ? 'mobile-view' : ''} ${isTabletView ? 'tablet-view' : ''}`}
      data-screen-width={screenWidth}
      data-mobile={isMobileView}
      data-tablet={isTabletView}
      data-ui-mode={uiMode}
      data-device-type={deviceType}
      data-orientation={orientation}
    >
      {/* Left Sidebar */}
      <div className={styles.sidebar}>
        {/* Sidebar Toggle Button (Mobile/Tablet) */}
        {(isMobileView || isTabletView) && (
          <button
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Show controls" : "Hide controls"}
            aria-label={sidebarCollapsed ? "Show controls" : "Hide controls"}
          >
            {sidebarCollapsed ? '▼' : '▲'}
          </button>
        )}
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>Text Behind Image</div>
          <div className={styles.subtitle}>AI-powered depth effects</div>
          <UpgradeButton />
        </div>

        {/* Text Settings Section */}
        <div className={`${styles.section} ${styles.fadeInDelayed}`}>
          <h3 className={styles.sectionTitle}>Text Settings</h3>
          
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="text-content-input">
              Text Content
              <span className={styles.characterCount}>({textContent.length} chars)</span>
            </label>
            <input
              id="text-content-input"
              type="text"
              value={textContent}
              onChange={(e) => handleTextContentChange(e.target.value)}
              className={`${styles.textInput} ${styles.stateTransition}`}
              placeholder="Enter your text here..."
              maxLength={100}
              aria-label="Text content input"
              aria-describedby="text-content-description"
            />
            <div id="text-content-description" className="sr-only">
              Enter the text that will appear behind the image subject. Maximum 100 characters.
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="font-family-select">Font Family</label>
            <select
              id="font-family-select"
              value={fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className={`${styles.select} ${styles.stateTransition}`}
              aria-label="Select font family for text"
              aria-describedby="font-family-description"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.name} value={font.name}>
                  {font.name}
                  {loadedFonts.has(font.name) && ' ✓'}
                  {fontLoadingErrors.has(font.name) && ' ⚠'}
                </option>
              ))}
            </select>
            <div id="font-family-description" className="sr-only">
              Choose the font family for your text. Checkmark indicates loaded fonts, warning indicates fallback fonts.
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="font-size-slider">Font Size: {fontSize}px</label>
            <div className={styles.fontSizeControls}>
              <input
                id="font-size-slider"
                type="range"
                min="8"
                max="200"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                className={`${styles.slider} ${styles.stateTransition}`}
                aria-label="Font size slider"
                aria-describedby="font-size-description"
              />
              <input
                id="font-size-number"
                type="number"
                min="8"
                max="200"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 8)}
                className={`${styles.numberInput} ${styles.stateTransition}`}
                placeholder="Size"
                aria-label="Font size number input"
                aria-describedby="font-size-description"
              />
            </div>
            <div id="font-size-description" className="sr-only">
              Adjust the font size between 8 and 200 pixels using the slider or number input.
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Text Style</label>
            <div className={styles.toggleGroup} role="group" aria-label="Text formatting options">
              <button
                className={`${styles.toggleButton} ${isBold ? styles.active : ''} ${styles.ripple} ${styles.stateTransition}`}
                onClick={toggleBold}
                title="Bold (Ctrl+B)"
                aria-label="Toggle bold text"
                aria-pressed={isBold}
                type="button"
              >
                <strong>B</strong>
              </button>
              <button
                className={`${styles.toggleButton} ${isItalic ? styles.active : ''} ${styles.ripple} ${styles.stateTransition}`}
                onClick={toggleItalic}
                title="Italic (Ctrl+I)"
                aria-label="Toggle italic text"
                aria-pressed={isItalic}
                type="button"
              >
                <em>I</em>
              </button>
              <button
                className={`${styles.toggleButton} ${isUnderline ? styles.active : ''} ${styles.ripple} ${styles.stateTransition}`}
                onClick={toggleUnderline}
                title="Underline (Ctrl+U)"
                aria-label="Toggle underlined text"
                aria-pressed={isUnderline}
                type="button"
              >
                <u>U</u>
              </button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="text-color-picker">
              Text Color
              <span className={styles.colorValue}>{textColor.toUpperCase()}</span>
            </label>
            <div className={styles.colorPickerContainer}>
              <input
                id="text-color-picker"
                type="color"
                value={textColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className={`${styles.colorPicker} ${styles.stateTransition}`}
                aria-label="Text color picker"
                aria-describedby="color-picker-description"
              />
              <div className={styles.colorPresets} role="group" aria-label="Color presets">
                {['#ffffff', '#000000', '#20B2AA', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'].map((color) => (
                  <button
                    key={color}
                    className={`${styles.colorPreset} ${textColor === color ? styles.active : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleTextColorChange(color)}
                    title={`Set color to ${color}`}
                    aria-label={`Set text color to ${color}`}
                    aria-pressed={textColor === color}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div id="color-picker-description" className="sr-only">
              Choose a text color using the color picker or select from preset colors below.
            </div>
          </div>
        </div>

        {/* Position & Effects Section */}
        <div className={`${styles.section} ${styles.fadeInDelayed}`}>
          <h3 className={styles.sectionTitle}>Position & Effects</h3>
          
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="horizontal-position-slider">Horizontal Position: {horizontalPosition}%</label>
            <input
              id="horizontal-position-slider"
              type="range"
              min="0"
              max="100"
              value={horizontalPosition}
              onChange={(e) => setHorizontalPosition(parseInt(e.target.value))}
              className={`${styles.slider} ${styles.stateTransition}`}
              aria-label="Horizontal text position"
              aria-describedby="horizontal-position-description"
            />
            <div id="horizontal-position-description" className="sr-only">
              Adjust the horizontal position of text from 0% (left) to 100% (right).
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="vertical-position-slider">Vertical Position: {verticalPosition}%</label>
            <input
              id="vertical-position-slider"
              type="range"
              min="0"
              max="100"
              value={verticalPosition}
              onChange={(e) => setVerticalPosition(parseInt(e.target.value))}
              className={`${styles.slider} ${styles.stateTransition}`}
              aria-label="Vertical text position"
              aria-describedby="vertical-position-description"
            />
            <div id="vertical-position-description" className="sr-only">
              Adjust the vertical position of text from 0% (top) to 100% (bottom).
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="text-rotation-slider">Text Rotation: {textRotation}°</label>
            <input
              id="text-rotation-slider"
              type="range"
              min="-180"
              max="180"
              value={textRotation}
              onChange={(e) => setTextRotation(parseInt(e.target.value))}
              className={`${styles.slider} ${styles.stateTransition}`}
              aria-label="Text rotation"
              aria-describedby="text-rotation-description"
            />
            <div id="text-rotation-description" className="sr-only">
              Rotate text from -180° to 180°.
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="text-opacity-slider">Opacity: {textOpacity}%</label>
            <input
              id="text-opacity-slider"
              type="range"
              min="0"
              max="100"
              value={textOpacity}
              onChange={(e) => setTextOpacity(parseInt(e.target.value))}
              className={`${styles.slider} ${styles.stateTransition}`}
              aria-label="Text opacity"
              aria-describedby="text-opacity-description"
            />
            <div id="text-opacity-description" className="sr-only">
              Adjust text transparency from 0% (invisible) to 100% (fully opaque).
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="depth-blur-slider">Depth Blur: {depthBlur}px</label>
            <input
              id="depth-blur-slider"
              type="range"
              min="0"
              max="20"
              value={depthBlur}
              onChange={(e) => setDepthBlur(parseInt(e.target.value))}
              className={`${styles.slider} ${styles.stateTransition}`}
              aria-label="Text depth blur effect"
              aria-describedby="depth-blur-description"
            />
            <div id="depth-blur-description" className="sr-only">
              Apply blur effect to text from 0px (no blur) to 20px (maximum blur).
            </div>
          </div>
        </div>



        {/* Export Section */}
        <div className={`${styles.exportSection} ${styles.fadeInDelayed}`}>
          <button
            onClick={handleExport}
            disabled={!isExportReady().ready}
            className={`${styles.exportButton} ${styles.ripple}`}
            aria-label={getExportTooltip()}
            title={getExportTooltip()}
            aria-describedby="export-button-description"
            type="button"
          >
            Download Image
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`${styles.uploadButton} ${styles.ripple}`}
            aria-label="Upload new image (Ctrl+O)"
            aria-describedby="upload-button-description"
            type="button"
          >
            Upload New Image
          </button>
          <div id="export-button-description" className="sr-only">
            Download the processed image with text behind the subject. Only available when an image is loaded.
          </div>
          <div id="upload-button-description" className="sr-only">
            Select a new image file to process. Supports JPG, PNG, WebP, and GIF formats.
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Enhanced Status Bar */}
        <div className={styles.statusBar} role="status" aria-live="polite" aria-label="Application status">
          <div className={`${styles.statusIndicator} ${statusVisible ? styles.statusVisible : styles.statusHidden}`}>
            <div 
              className={`${styles.statusDot} ${styles[statusType]} ${isProcessing ? styles.processing : ''}`}
              aria-hidden="true"
            ></div>
            <span className={styles.statusText} aria-label={`Status: ${statusMessage}`}>{statusMessage}</span>
            {isProcessing && (
              <div className={styles.processingSteps}>
                <span className={styles.stepIndicator} aria-label={`Processing step ${processingStep === 'loading' ? '1' : processingStep === 'processing' ? '2' : processingStep === 'converting' ? '3' : 'complete'} of 3`}>
                  Step {processingStep === 'loading' ? '1' : processingStep === 'processing' ? '2' : processingStep === 'converting' ? '3' : '✓'} of 3
                </span>
              </div>
            )}
          </div>
          {isProcessing && (
            <div className={`${styles.progressContainer} ${styles.fadeIn}`} role="progressbar" aria-valuenow={processingProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Processing progress">
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${processingProgress}%` }}
                  aria-hidden="true"
                ></div>
              </div>
              <span className={styles.progressText} aria-label={`${processingProgress} percent complete`}>{processingProgress}%</span>
              <div className={styles.processingTime}>
                {getProcessingDuration() > 0 && (
                  <span className={styles.timeIndicator} aria-label={`Processing time: ${Math.floor(getProcessingDuration() / 1000)} seconds`}>
                    {Math.floor(getProcessingDuration() / 1000)}s
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Viewport Container */}
        <div 
          className={`${styles.viewport} ${isDragOver ? styles.dragOver : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="main"
          aria-label="Image editing workspace"
        >
          <UserAvatar />
          {!currentImage ? (
            /* Upload Area */
            <div 
              className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ''} ${styles.fadeInUp} ${styles.stateTransition}`}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload image area - click to browse files or drag and drop"
              aria-describedby="upload-area-description"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className={`${styles.uploadIcon} ${styles.stateTransition}`} aria-hidden="true">🖼️</div>
              <h3 className={`${styles.uploadTitle} ${styles.stateTransition}`}>Drop your image here</h3>
              <p className={`${styles.uploadSubtitle} ${styles.stateTransition}`}>Or click to browse files</p>
              <p className={`${styles.uploadFormats} ${styles.stateTransition}`}>Supports JPG, PNG, WebP, GIF</p>
              <div id="upload-area-description" className="sr-only">
                Drag and drop an image file here, or click to open file browser. Supported formats: JPEG, PNG, WebP, GIF. Maximum file size: 10MB.
              </div>
            </div>
          ) : (
            /* Canvas Area */
            <div className={styles.canvasContainer}>
              <canvas
                ref={canvasRef}
                className={`${styles.canvas} ${isPinching ? 'pinching' : ''} ${isTouchPanning ? 'panning' : ''}`}
                onWheel={handleCanvasWheel}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
                onTouchStart={handleCanvasTouchStart}
                onTouchMove={handleCanvasTouchMove}
                onTouchEnd={handleCanvasTouchEnd}
                style={{
                  cursor: zoomLevel > 100 ? (isDragging || isTouchPanning ? 'grabbing' : 'grab') : 'default',
                  transform: `translate(${translateX}px, ${translateY}px) scale(${zoomLevel / 100})`
                }}
                role="img"
                aria-label={`Image with text overlay: ${textContent}`}
                aria-describedby="canvas-description"
                tabIndex={0}
              />
              <div id="canvas-description" className="sr-only">
                Interactive canvas showing your image with text positioned behind the subject. Use Ctrl+scroll to zoom, click and drag to pan when zoomed in.
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.zoomControls} role="group" aria-label="Zoom controls">
            <button
              className={`${styles.zoomButton} ${styles.ripple} ${styles.stateTransition}`}
              onClick={zoomOut}
              disabled={isZoomAtMin()}
              title="Zoom Out"
              aria-label="Zoom out"
              type="button"
            >
              −
            </button>
            <span 
              className={`${styles.zoomLevel} ${zoomLevel !== 100 ? styles.zoomActive : ''} ${styles.stateTransition}`}
              title={`Current zoom: ${zoomLevel}%`}
              aria-label={`Current zoom level: ${zoomLevel} percent`}
              role="status"
            >
              {zoomLevel}%
            </span>
            <button
              className={`${styles.zoomButton} ${styles.ripple} ${styles.stateTransition}`}
              onClick={zoomIn}
              disabled={isZoomAtMax()}
              title="Zoom In"
              aria-label="Zoom in"
              type="button"
            >
              +
            </button>
            <button
              className={`${styles.zoomButton} ${styles.ripple} ${styles.stateTransition}`}
              onClick={resetCanvasView}
              title="Reset View"
              aria-label="Reset zoom and pan to default view"
              type="button"
            >
              ⌂
            </button>
            <button
              className={`${styles.agentModeButton} ${styles.ripple} ${styles.stateTransition} ${isAgentModeEnabled ? styles.agentModeActive : ''}`}
              onClick={() => {
                const newAgentMode = !isAgentModeEnabled;
                setIsAgentModeEnabled(newAgentMode);
                showStatus(
                  newAgentMode ? "Agent Mode enabled - AI assistant is now active" : "Agent Mode disabled",
                  newAgentMode ? 'success' : 'info',
                  2000
                );
              }}
              title={isAgentModeEnabled ? "Disable Agent Mode" : "Enable Agent Mode"}
              aria-label={isAgentModeEnabled ? "Disable AI Agent Mode" : "Enable AI Agent Mode"}
              type="button"
            >
              Agent Mode
            </button>
          </div>

          <div className={styles.viewInfo}>
            {currentImage && (
              <span className={styles.imageInfo}>
                {currentImage.naturalWidth} × {currentImage.naturalHeight}
              </span>
            )}
            {zoomLevel > 100 && (
              <span className={styles.panHint}>
                Click and drag to pan
              </span>
            )}
            {isAgentModeEnabled && (
              <span className={styles.agentModeIndicator}>
                🤖 Agent Mode Active
              </span>
            )}
          </div>


        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(file);
              // Clear the input so the same file can be selected again
              e.target.value = '';
            }
          }}
          className={styles.hiddenInput}
          aria-label="File input for image upload"
          aria-describedby="file-input-description"
        />
        <div id="file-input-description" className="sr-only">
          Hidden file input for selecting image files. Triggered by upload buttons and drag-and-drop area.
        </div>
      </div>

      {/* Agent Sidebar */}
      <AgentSidebar 
        isOpen={isAgentModeEnabled} 
        onClose={() => setIsAgentModeEnabled(false)} 
      />
    </div>
  );
};

