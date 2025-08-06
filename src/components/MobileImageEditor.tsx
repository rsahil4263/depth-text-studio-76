import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import styles from "./MobileImageEditor.module.css";
import { segmentSubject, loadImage, renderTextBehindSubject } from "@/lib/backgroundRemoval";
import { LoadingOverlay, InlineLoading } from "@/components/LoadingState";
import { MobilePerformanceOptimizer } from "@/lib/mobilePerformanceOptimizations";
import { UserAvatar } from "@/components/UserAvatar";

// Core TypeScript interfaces for mobile component data models

/**
 * Props interface for the MobileImageEditor component
 * Enhanced with mobile-specific integration callbacks
 */
interface MobileImageEditorProps {
  className?: string;
  onImageLoad?: (image: HTMLImageElement) => void;
  onTextChange?: (text: string) => void;
  onExport?: (canvas: HTMLCanvasElement) => void;
  onError?: (error: Error, context: string) => void;
  onStatusChange?: (status: string, isProcessing: boolean) => void;
  // Mobile-specific data attributes
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
  bold: boolean;
  italic: boolean;
  underline: boolean;
}



/**
 * Mobile panel types for sliding panel system
 */
type MobilePanelType = 'text' | 'position' | 'pro' | null;



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
 * Zoom level constraints for mobile
 */
const ZOOM_CONSTRAINTS = {
  MIN: 50,
  MAX: 300,
  STEP: 25,
  DEFAULT: 100
} as const;

export const MobileImageEditor: React.FC<MobileImageEditorProps> = ({
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
  // Initialize mobile performance optimizer
  const mobileOptimizer = useMemo(() => new MobilePerformanceOptimizer(), []);
  
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

  // === MOBILE UI STATE ===
  const [activePanel, setActivePanel] = useState<MobilePanelType>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Ready");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  
  // === CONTROL VISIBILITY STATE ===
  const [showControls, setShowControls] = useState<boolean>(true);
  const [controlsAnimationKey, setControlsAnimationKey] = useState<number>(0);
  
  // === PANEL GESTURE STATE ===
  const [panelTouchStart, setPanelTouchStart] = useState<{ y: number; time: number } | null>(null);
  const [panelDragY, setPanelDragY] = useState<number>(0);
  const [isPanelDragging, setIsPanelDragging] = useState<boolean>(false);

  // === CANVAS GESTURE STATE ===
  const [canvasTouchStart, setCanvasTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
  const [isCanvasPanning, setIsCanvasPanning] = useState<boolean>(false);
  const [isPinching, setIsPinching] = useState<boolean>(false);
  const [initialPinchZoom, setInitialPinchZoom] = useState<number>(100);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number>(0);

  // === DRAG AND DROP GESTURE STATE ===
  const [dragTouchStart, setDragTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [dragFeedbackScale, setDragFeedbackScale] = useState<number>(1);

  // === UTILITY FUNCTIONS ===
  
  /**
   * Trigger haptic feedback if supported
   */
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 50,
        medium: 100,
        heavy: 200
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  /**
   * Show status message with auto-hide and integration callback
   */
  const showStatusMessage = useCallback((message: string, duration: number = 2000) => {
    setStatusMessage(message);
    
    // Call the integration callback if provided
    if (onStatusChange) {
      onStatusChange(message, isProcessing);
    }
    
    if (duration > 0) {
      setTimeout(() => {
        if (!isProcessing) {
          setStatusMessage("Ready");
          if (onStatusChange) {
            onStatusChange("Ready", false);
          }
        }
      }, duration);
    }
  }, [isProcessing, onStatusChange]);

  // Mobile-optimized debounced functions for real-time updates
  const debouncedTextUpdate = useMemo(() => 
    mobileOptimizer.debouncer.debounce('textUpdate', () => {
      renderCanvas();
    }), [mobileOptimizer.debouncer]
  );

  const debouncedSliderUpdate = useMemo(() => 
    mobileOptimizer.debouncer.throttle('sliderUpdate', () => {
      renderCanvas();
    }), [mobileOptimizer.debouncer]
  );

  const debouncedPositionUpdate = useMemo(() => 
    mobileOptimizer.debouncer.smartDebounce(
      'positionUpdate', 
      () => renderCanvas(),
      () => ({ x: horizontalPosition, y: verticalPosition, rotation: textRotation })
    ), [mobileOptimizer.debouncer, horizontalPosition, verticalPosition, textRotation]
  );

  // === SIMPLE ERROR HANDLING ===
  const handleComponentError = useCallback((error: Error, context: string) => {
    console.error(`MobileImageEditor error [${context}]:`, error);
    if (onError) {
      onError(error, context);
    }
    showStatusMessage(`Error: ${error.message}`, 3000);
    triggerHapticFeedback('heavy');
  }, [onError, showStatusMessage, triggerHapticFeedback]);



  // === DERIVED STATE OBJECTS ===

  // === UTILITY FUNCTIONS ===

  /**
   * Get the full font family string with fallbacks
   */
  const getFontFamilyWithFallback = useCallback((fontName: string): string => {
    const fontConfig = FONT_FAMILIES.find(f => f.name === fontName);
    return fontConfig ? `"${fontConfig.name}", ${fontConfig.fallback}` : fontName;
  }, []);

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
   * Constrain zoom level within bounds
   */
  const constrainZoom = useCallback((zoom: number): number => {
    return Math.max(ZOOM_CONSTRAINTS.MIN, Math.min(ZOOM_CONSTRAINTS.MAX, zoom));
  }, []);

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
  }, []);

  // === PANEL MANAGEMENT ===

  /**
   * Close the currently active panel with animation
   */
  const closePanel = useCallback(() => {
    setActivePanel(null);
    setPanelDragY(0);
    setIsPanelDragging(false);
    setPanelTouchStart(null);
  }, []);

  /**
   * Toggle a specific panel (open if closed, close if open) with haptic feedback
   */
  const togglePanel = useCallback((panel: MobilePanelType) => {
    triggerHapticFeedback('medium');
    
    // Show controls with animation when opening a panel
    if (!activePanel && panel) {
      setShowControls(true);
      setControlsAnimationKey(prev => prev + 1);
    }
    
    setActivePanel(current => current === panel ? null : panel);
    setPanelDragY(0);
    setIsPanelDragging(false);
    setPanelTouchStart(null);
  }, [triggerHapticFeedback, activePanel]);

  /**
   * Show controls with entrance animation
   */
  const showControlsWithAnimation = useCallback(() => {
    setShowControls(true);
    setControlsAnimationKey(prev => prev + 1);
    triggerHapticFeedback('light');
  }, [triggerHapticFeedback]);

  /**
   * Hide controls with exit animation
   */
  const hideControlsWithAnimation = useCallback(() => {
    setShowControls(false);
    triggerHapticFeedback('light');
  }, [triggerHapticFeedback]);

  // === PANEL GESTURE HANDLERS ===

  /**
   * Handle touch start on panel for swipe gesture
   */
  const handlePanelTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setPanelTouchStart({
      y: touch.clientY,
      time: Date.now()
    });
    setIsPanelDragging(false);
  }, []);

  /**
   * Handle touch move on panel for swipe gesture
   */
  const handlePanelTouchMove = useCallback((e: React.TouchEvent) => {
    if (!panelTouchStart) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - panelTouchStart.y;
    
    // Only allow downward swipes to close
    if (deltaY > 0) {
      setPanelDragY(deltaY);
      setIsPanelDragging(true);
      
      // Prevent scrolling when dragging
      e.preventDefault();
    }
  }, [panelTouchStart]);

  /**
   * Handle touch end on panel for swipe gesture
   */
  const handlePanelTouchEnd = useCallback(() => {
    if (!panelTouchStart || !isPanelDragging) {
      setPanelTouchStart(null);
      setPanelDragY(0);
      setIsPanelDragging(false);
      return;
    }

    const swipeDistance = panelDragY;
    const swipeTime = Date.now() - panelTouchStart.time;
    const swipeVelocity = swipeDistance / swipeTime;

    // Close panel if swipe distance > 100px or velocity > 0.5px/ms
    if (swipeDistance > 100 || swipeVelocity > 0.5) {
      triggerHapticFeedback('medium');
      closePanel();
    } else {
      // Snap back to original position
      setPanelDragY(0);
      setIsPanelDragging(false);
    }
    
    setPanelTouchStart(null);
  }, [panelTouchStart, isPanelDragging, panelDragY, closePanel, triggerHapticFeedback]);

  // === PANEL NAVIGATION (Swipe navigation removed to prevent conflicts with sliders) ===

  /**
   * Handle backdrop touch with haptic feedback
   */
  const handleBackdropTouch = useCallback(() => {
    triggerHapticFeedback('light');
    closePanel();
  }, [closePanel, triggerHapticFeedback]);

  // === CANVAS GESTURE HANDLERS ===

  /**
   * Handle touch start on canvas for pan and pinch gestures
   */
  const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
    if (!currentImage) return;

    // Show controls when user interacts with canvas
    if (!showControls) {
      showControlsWithAnimation();
    }

    const touches = e.touches;
    
    if (touches.length === 1) {
      // Single touch - start panning
      const touch = touches[0];
      setCanvasTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      });
      setIsCanvasPanning(false);
      setIsPinching(false);
    } else if (touches.length === 2) {
      // Two touches - start pinching
      const distance = getTouchDistance(touches[0], touches[1]);
      setLastTouchDistance(distance);
      setInitialPinchDistance(distance);
      setInitialPinchZoom(zoomLevel);
      setIsPinching(true);
      setIsCanvasPanning(false);
      setCanvasTouchStart(null);
      
      // Prevent default to avoid scrolling
      e.preventDefault();
    }
  }, [currentImage, zoomLevel, getTouchDistance]);

  /**
   * Handle touch move on canvas for pan and pinch gestures
   */
  const handleCanvasTouchMove = useCallback((e: React.TouchEvent) => {
    if (!currentImage) return;

    const touches = e.touches;

    if (touches.length === 1 && canvasTouchStart && !isPinching) {
      // Single touch panning
      const touch = touches[0];
      const deltaX = touch.clientX - canvasTouchStart.x;
      const deltaY = touch.clientY - canvasTouchStart.y;
      
      // Only start panning if moved more than threshold
      if (!isCanvasPanning && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        setIsCanvasPanning(true);
        triggerHapticFeedback('light');
      }
      
      if (isCanvasPanning) {
        setTranslateX(prev => prev + deltaX * 0.5);
        setTranslateY(prev => prev + deltaY * 0.5);
        
        setCanvasTouchStart({
          x: touch.clientX,
          y: touch.clientY,
          time: canvasTouchStart.time
        });
        
        e.preventDefault();
      }
    } else if (touches.length === 2 && isPinching) {
      // Two touch pinch-to-zoom
      const distance = getTouchDistance(touches[0], touches[1]);
      const scale = distance / initialPinchDistance;
      const newZoom = constrainZoom(initialPinchZoom * scale);
      
      // Only update if zoom changed significantly
      if (Math.abs(newZoom - zoomLevel) > 2) {
        setZoomLevel(newZoom);
        
        // Light haptic feedback during pinch
        if (Math.abs(distance - lastTouchDistance) > 20) {
          triggerHapticFeedback('light');
          setLastTouchDistance(distance);
        }
      }
      
      e.preventDefault();
    }
  }, [
    currentImage,
    canvasTouchStart,
    isPinching,
    isCanvasPanning,
    zoomLevel,
    initialPinchZoom,
    initialPinchDistance,
    lastTouchDistance,
    getTouchDistance,
    constrainZoom,
    triggerHapticFeedback
  ]);

  /**
   * Handle touch end on canvas
   */
  const handleCanvasTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // All touches ended
      setCanvasTouchStart(null);
      setIsCanvasPanning(false);
      setIsPinching(false);
      setLastTouchDistance(0);
      setInitialPinchDistance(0);
      setInitialPinchZoom(100);
    } else if (e.touches.length === 1 && isPinching) {
      // Went from pinch to single touch
      const touch = e.touches[0];
      setCanvasTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      });
      setIsPinching(false);
      setIsCanvasPanning(false);
    }
  }, [isPinching]);

  // === IMAGE PROCESSING HANDLERS ===

  /**
   * Process image file for mobile with mobile-optimized performance
   */
  const processMobileImageFile = useCallback(async (file: File) => {
    try {
      // Log performance stats before processing
      mobileOptimizer.logPerformanceStats();
      
      updateProcessingStatus('loading', 10, "Loading image...");

      // Use mobile-optimized image loading
      const img = await loadImage(file);
      setCurrentImage(img);
      
      updateProcessingStatus('processing', 30, "Processing background...");
      
      // Use mobile-optimized segmentation with progress tracking
      // Remove the mobile timeout since backgroundRemoval.ts already has timeout and fallback handling
      const segmentResult = await segmentSubject(img, (step: string, progress: number) => {
        const adjustedProgress = mobileOptimizer.batteryOptimizer.shouldReduceQuality() ? 
          Math.min(progress * 1.2, 100) : progress; // Faster progress indication in battery saver mode
        updateProcessingStatus('processing', 30 + (adjustedProgress * 0.6), `${step} ${Math.round(adjustedProgress)}%`);
      });

      console.log('Setting processed canvas and mask:', {
        canvas: !!segmentResult.canvas,
        canvasSize: segmentResult.canvas ? { width: segmentResult.canvas.width, height: segmentResult.canvas.height } : null,
        mask: !!segmentResult.mask,
        maskSize: segmentResult.mask ? { width: segmentResult.mask.width, height: segmentResult.mask.height } : null
      });

      setProcessedCanvas(segmentResult.canvas);
      setImageMask(segmentResult.mask);
      
      updateProcessingStatus('complete', 100, "Image loaded successfully!");
      
      if (onImageLoad) {
        onImageLoad(img);
      }
      
      // Manually trigger canvas render after processing
      setTimeout(() => {
        console.log('Manually triggering canvas render after processing');
        renderCanvas();
      }, 100);

      // Adaptive timeout based on device performance
      const successTimeout = mobileOptimizer.capabilities.isLowEndDevice ? 2000 : 1500;
      setTimeout(() => {
        setIsProcessing(false);
        setStatusMessage("Ready");
        if (onStatusChange) {
          onStatusChange("Ready", false);
        }
      }, successTimeout);
      
      // Haptic feedback for success
      triggerHapticFeedback('medium');
      
      // Log performance stats after processing
      mobileOptimizer.logPerformanceStats();
      
      return { img, segmentResult };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Mobile image processing failed');
      
      // Check if it's a timeout error - but the fallback should have handled it
      if (errorObj.message.includes('timed out') || errorObj.message.includes('timeout')) {
        // This shouldn't happen now since we have fallback, but just in case
        updateProcessingStatus('error', 0, 'Processing failed');
        showStatusMessage('Processing failed. Please try a different image.', 5000);
      } else if (errorObj.message.includes('fallback')) {
        // Fallback processing failed too
        updateProcessingStatus('error', 0, 'Processing failed');
        showStatusMessage('Unable to process image. Please try a different image.', 5000);
      } else {
        updateProcessingStatus('error', 0, 'Processing failed');
        handleComponentError(errorObj, 'Mobile Image Processing');
      }
      
      // Haptic feedback for error
      triggerHapticFeedback('heavy');
      
      setIsProcessing(false);
      setTimeout(() => {
        if (onStatusChange) {
          onStatusChange("Ready", false);
        }
      }, 1000);
      
      // Don't throw the error - just log it and let the UI handle it gracefully
      console.error('Mobile image processing error:', errorObj);
    }
  }, [
    mobileOptimizer,
    updateProcessingStatus,
    onImageLoad,
    triggerHapticFeedback,
    handleComponentError,
    onStatusChange
  ]);

  /**
   * Handle file upload with mobile-optimized validation and error handling
   */
  const handleFileUpload = useCallback(async (file: File) => {
    // Enhanced file validation
    if (!file || !file.type.startsWith('image/')) {
      const error = new Error("Please select a valid image file (JPG, PNG, WebP, GIF)");
      handleComponentError(error, 'Mobile File Validation');
      return;
    }

    // Get mobile-optimized file size limits based on device capabilities and battery
    const optimizationConfig = mobileOptimizer.getOptimizationConfig();
    const maxSize = optimizationConfig.maxFileSize;
    
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      const deviceInfo = mobileOptimizer.capabilities.isLowEndDevice ? ' (low-end device)' : '';
      const batteryInfo = mobileOptimizer.batteryOptimizer.shouldReduceQuality() ? ' (battery saver mode)' : '';
      
      const error = new Error(
        `File too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB${deviceInfo}${batteryInfo}.`
      );
      handleComponentError(error, 'Mobile File Size Validation');
      return;
    }

    // Start processing with mobile-optimized feedback
    setIsProcessing(true);
    updateProcessingStatus('loading', 0, `Loading ${file.name}...`);
    
    // Haptic feedback for start
    triggerHapticFeedback('light');
    
    try {
      await processMobileImageFile(file);
    } catch (error) {
      console.error('Mobile file upload failed:', error);
      setIsProcessing(false);
      updateProcessingStatus('error', 0, 'Upload failed');
    }
  }, [
    mobileOptimizer,
    handleComponentError,
    processMobileImageFile,
    updateProcessingStatus,
    triggerHapticFeedback
  ]);

  // === DRAG AND DROP HANDLERS ===

  /**
   * Handle drag and drop events for desktop
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      triggerHapticFeedback('medium');
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload, triggerHapticFeedback]);

  /**
   * Handle touch-based drag and drop for mobile
   */
  const handleUploadTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setIsDragActive(false);
    setDragFeedbackScale(1);
  }, []);

  const handleUploadTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragTouchStart) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragTouchStart.x;
    const deltaY = touch.clientY - dragTouchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Start drag feedback if moved enough
    if (!isDragActive && distance > 10) {
      setIsDragActive(true);
      setIsDragOver(true);
      triggerHapticFeedback('light');
    }

    if (isDragActive) {
      // Scale feedback based on movement
      const scale = Math.min(1.1, 1 + distance / 1000);
      setDragFeedbackScale(scale);
      
      // Prevent scrolling during drag
      e.preventDefault();
    }
  }, [dragTouchStart, isDragActive, triggerHapticFeedback]);

  const handleUploadTouchEnd = useCallback(() => {
    if (isDragActive) {
      // Trigger file picker on successful drag gesture
      triggerHapticFeedback('medium');
      fileInputRef.current?.click();
    }
    
    setDragTouchStart(null);
    setIsDragActive(false);
    setIsDragOver(false);
    setDragFeedbackScale(1);
  }, [isDragActive, triggerHapticFeedback]);

  // === TEXT STYLING HANDLERS ===

  /**
   * Toggle text bold style with haptic feedback and optimized updates
   */
  const toggleBold = useCallback(() => {
    triggerHapticFeedback('light');
    setIsBold(prev => {
      const newValue = !prev;
      showStatusMessage(newValue ? "Bold enabled" : "Bold disabled", 1000);
      debouncedTextUpdate();
      return newValue;
    });
  }, [showStatusMessage, triggerHapticFeedback, debouncedTextUpdate]);

  /**
   * Toggle text italic style with haptic feedback and optimized updates
   */
  const toggleItalic = useCallback(() => {
    triggerHapticFeedback('light');
    setIsItalic(prev => {
      const newValue = !prev;
      showStatusMessage(newValue ? "Italic enabled" : "Italic disabled", 1000);
      debouncedTextUpdate();
      return newValue;
    });
  }, [showStatusMessage, triggerHapticFeedback, debouncedTextUpdate]);

  /**
   * Toggle text underline style with haptic feedback and optimized updates
   */
  const toggleUnderline = useCallback(() => {
    triggerHapticFeedback('light');
    setIsUnderline(prev => {
      const newValue = !prev;
      showStatusMessage(newValue ? "Underline enabled" : "Underline disabled", 1000);
      debouncedTextUpdate();
      return newValue;
    });
  }, [showStatusMessage, triggerHapticFeedback, debouncedTextUpdate]);

  // Mobile-optimized text content handler
  const handleTextContentChange = useCallback((newText: string) => {
    setTextContent(newText);
    debouncedTextUpdate();
  }, [debouncedTextUpdate]);

  // Mobile-optimized slider handlers
  const handleFontSizeChange = useCallback((newSize: number) => {
    setFontSize(newSize);
    debouncedSliderUpdate();
  }, [debouncedSliderUpdate]);

  const handleOpacityChange = useCallback((newOpacity: number) => {
    setTextOpacity(newOpacity);
    debouncedSliderUpdate();
  }, [debouncedSliderUpdate]);

  const handleBlurChange = useCallback((newBlur: number) => {
    setDepthBlur(newBlur);
    debouncedSliderUpdate();
  }, [debouncedSliderUpdate]);

  // Mobile-optimized position handlers
  const handleHorizontalPositionChange = useCallback((newPosition: number) => {
    setHorizontalPosition(newPosition);
    debouncedPositionUpdate();
  }, [debouncedPositionUpdate]);

  const handleVerticalPositionChange = useCallback((newPosition: number) => {
    setVerticalPosition(newPosition);
    debouncedPositionUpdate();
  }, [debouncedPositionUpdate]);

  const handleTextRotationChange = useCallback((newRotation: number) => {
    setTextRotation(newRotation);
    debouncedPositionUpdate();
  }, [debouncedPositionUpdate]);

  // Mobile-optimized font and color handlers
  const handleFontFamilyChange = useCallback((newFamily: string) => {
    setFontFamily(newFamily);
    debouncedTextUpdate();
  }, [debouncedTextUpdate]);

  const handleColorChange = useCallback((newColor: string) => {
    setTextColor(newColor);
    debouncedTextUpdate();
  }, [debouncedTextUpdate]);

  // === EXPORT FUNCTIONALITY ===

  /**
   * Create high-quality export canvas for mobile (simple text overlay)
   */
  const createExportCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!processedCanvas) {
      return null;
    }

    try {
      // Create export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = processedCanvas.width;
      exportCanvas.height = processedCanvas.height;
      const ctx = exportCanvas.getContext('2d');
      
      if (!ctx) {
        return null;
      }

      // Draw the processed image
      ctx.drawImage(processedCanvas, 0, 0);

      // Add simple text overlay if there's text content
      if (textContent.trim()) {
        // Configure text rendering
        let fontStyle = '';
        if (isItalic) fontStyle += 'italic ';
        if (isBold) fontStyle += 'bold ';
        
        const fontString = `${fontStyle}${fontSize}px ${getFontFamilyWithFallback(fontFamily)}`;
        
        // Set text properties
        ctx.font = fontString;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = textOpacity / 100;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Apply blur if specified
        if (depthBlur > 0) {
          ctx.filter = `blur(${depthBlur}px)`;
        }
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Calculate text position
        const textX = (horizontalPosition / 100) * exportCanvas.width;
        const textY = (verticalPosition / 100) * exportCanvas.height;
        
        // Apply rotation if specified
        if (textRotation !== 0) {
          ctx.save();
          ctx.translate(textX, textY);
          ctx.rotate((textRotation * Math.PI) / 180);
          ctx.translate(-textX, -textY);
        }
        
        // Draw text
        ctx.fillText(textContent, textX, textY);
        
        // Add underline if needed
        if (isUnderline) {
          const textMetrics = ctx.measureText(textContent);
          const textWidth = textMetrics.width;
          const underlineY = textY + fontSize * 0.1;
          
          ctx.strokeStyle = textColor;
          ctx.lineWidth = Math.max(1, fontSize * 0.05);
          ctx.beginPath();
          ctx.moveTo(textX - textWidth / 2, underlineY);
          ctx.lineTo(textX + textWidth / 2, underlineY);
          ctx.stroke();
        }
        
        // Restore context if rotation was applied
        if (textRotation !== 0) {
          ctx.restore();
        }
        
        // Reset context
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
      }

      return exportCanvas;
    } catch (error) {
      console.error('Error creating mobile export canvas:', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error as Error, 'Mobile Export Canvas Creation');
      }
      
      return null;
    }
  }, [
    processedCanvas, 
    fontSize, 
    fontFamily, 
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
    getFontFamilyWithFallback,
    onError
  ]);

  /**
   * Handle image export with mobile-optimized feedback
   */
  const handleExport = useCallback(async () => {
    if (!currentImage || !processedCanvas || isProcessing) {
      showStatusMessage("Cannot export: Image not ready", 2000);
      return;
    }
    
    // For mobile, we don't require text content - can export just the processed image
    // if (!textContent.trim()) {
    //   showStatusMessage("Cannot export: No text content", 2000);
    //   return;
    // }

    try {
      showStatusMessage("Preparing export...", 0);
      
      const exportCanvas = createExportCanvas();
      if (!exportCanvas) {
        showStatusMessage("Export failed", 2000);
        return;
      }

      showStatusMessage("Generating image...", 0);

      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, 'image/png', 1.0);
      });
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        link.href = url;
        link.download = `text-behind-image_${timestamp}.png`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(1);
        showStatusMessage(`Export complete! (${fileSizeMB}MB)`, 3000);
        
        if (onExport) {
          onExport(exportCanvas);
        }
      } else {
        showStatusMessage("Export failed", 2000);
      }
    } catch (error) {
      console.error('Export error:', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error as Error, 'Image Export');
      }
      
      showStatusMessage("Export failed", 2000);
    }
  }, [
    currentImage,
    processedCanvas,
    imageMask,
    isProcessing,
    textContent,
    createExportCanvas,
    onExport,
    onError,
    showStatusMessage
  ]);

  // === CANVAS RENDERING ===

  /**
   * Render canvas with mobile-optimized display and memory management
   */
  const renderCanvas = useCallback(() => {
    console.log('renderCanvas called', { 
      processedCanvas: !!processedCanvas, 
      canvasRef: !!canvasRef.current,
      imageMask: !!imageMask,
      currentImage: !!currentImage
    });

    if (!processedCanvas || !canvasRef.current) {
      console.log('renderCanvas early return: missing processedCanvas or canvasRef');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('renderCanvas early return: no canvas context');
      return;
    }

    // Set canvas size to match container
    const container = containerRef.current;
    if (!container) {
      console.log('renderCanvas early return: no container');
      return;
    }

    const rect = container.getBoundingClientRect();
    const maxWidth = rect.width - 32; // Account for padding
    const maxHeight = rect.height - 200; // Account for controls

    // Calculate display dimensions with mobile optimization
    const aspectRatio = processedCanvas.width / processedCanvas.height;
    let displayWidth = maxWidth;
    let displayHeight = maxWidth / aspectRatio;

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = maxHeight * aspectRatio;
    }

    // Apply zoom with mobile-specific limits
    const effectiveZoomLevel = mobileOptimizer.capabilities.isLowEndDevice ? 
      Math.min(zoomLevel, 200) : zoomLevel; // Limit zoom on low-end devices
    
    const zoomedWidth = (displayWidth * effectiveZoomLevel) / 100;
    const zoomedHeight = (displayHeight * effectiveZoomLevel) / 100;

    // Use mobile-optimized canvas sizing
    const maxCanvasSize = mobileOptimizer.capabilities.maxTextureSize;
    const canvasScale = Math.min(1, maxCanvasSize / Math.max(zoomedWidth, zoomedHeight));
    
    canvas.width = Math.floor(zoomedWidth * canvasScale);
    canvas.height = Math.floor(zoomedHeight * canvasScale);

    console.log('Canvas dimensions:', { 
      width: canvas.width, 
      height: canvas.height,
      processedCanvasSize: { width: processedCanvas.width, height: processedCanvas.height }
    });

    // Configure context for mobile performance
    ctx.imageSmoothingEnabled = !mobileOptimizer.capabilities.isLowEndDevice;
    ctx.imageSmoothingQuality = mobileOptimizer.capabilities.isLowEndDevice ? 'low' : 'medium';

    // Clear and draw with optimized operations
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      // Always draw the processed image first
      ctx.drawImage(processedCanvas, 0, 0, canvas.width, canvas.height);
      console.log('Drew processed canvas to display canvas');

      // Render simple text overlay for mobile (no text-behind-subject logic)
      if (textContent.trim()) {
        console.log('Rendering simple text overlay for mobile', {
          textContent,
          fontSize,
          textColor,
          textOpacity,
          horizontalPosition,
          verticalPosition
        });
        
        // Configure text rendering
        const scaledFontSize = (fontSize * effectiveZoomLevel * canvasScale) / 100;
        let fontStyle = '';
        if (isItalic) fontStyle += 'italic ';
        if (isBold) fontStyle += 'bold ';
        
        const fontString = `${fontStyle}${scaledFontSize}px ${getFontFamilyWithFallback(fontFamily)}`;
        
        // Set text properties
        ctx.font = fontString;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = textOpacity / 100;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Apply blur if specified
        if (depthBlur > 0 && !mobileOptimizer.batteryOptimizer.shouldReduceQuality()) {
          ctx.filter = `blur(${Math.min(depthBlur, 2)}px)`;
        } else {
          ctx.filter = 'none';
        }
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Calculate text position
        const textX = (horizontalPosition / 100) * canvas.width;
        const textY = (verticalPosition / 100) * canvas.height;
        
        console.log('Drawing simple text overlay:', {
          font: fontString,
          fillStyle: textColor,
          globalAlpha: textOpacity / 100,
          position: { x: textX, y: textY },
          rotation: textRotation,
          text: textContent
        });
        
        // Apply rotation if specified
        if (textRotation !== 0) {
          ctx.save();
          ctx.translate(textX, textY);
          ctx.rotate((textRotation * Math.PI) / 180);
          ctx.translate(-textX, -textY);
        }
        
        // Draw text directly on canvas
        ctx.fillText(textContent, textX, textY);
        
        // Add underline if needed
        if (isUnderline) {
          const textMetrics = ctx.measureText(textContent);
          const textWidth = textMetrics.width;
          const underlineY = textY + scaledFontSize * 0.1;
          
          ctx.strokeStyle = textColor;
          ctx.lineWidth = Math.max(1, scaledFontSize * 0.05);
          ctx.beginPath();
          ctx.moveTo(textX - textWidth / 2, underlineY);
          ctx.lineTo(textX + textWidth / 2, underlineY);
          ctx.stroke();
        }
        
        // Restore context if rotation was applied
        if (textRotation !== 0) {
          ctx.restore();
        }
        
        // Reset shadow and filter
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
        
        console.log('Simple text overlay drawn on mobile');
      } else {
        console.log('No text content - just showing processed image');
      }
    } catch (error) {
      console.error('Error in renderCanvas:', error);
      // Fallback: try to draw just the processed image
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(processedCanvas, 0, 0, canvas.width, canvas.height);
        console.log('Fallback: drew processed canvas only');
      } catch (fallbackError) {
        console.error('Fallback rendering also failed:', fallbackError);
      }
    }
  }, [
    mobileOptimizer,
    processedCanvas,
    imageMask,
    textContent,
    fontSize,
    fontFamily,
    textColor,
    textOpacity,
    horizontalPosition,
    verticalPosition,
    textRotation,
    depthBlur,
    isBold,
    isItalic,
    isUnderline,
    zoomLevel,
    getFontFamilyWithFallback,
    currentImage
  ]);

  // === EFFECTS ===

  /**
   * Text change callback effect
   */
  useEffect(() => {
    if (onTextChange) {
      onTextChange(textContent);
    }
  }, [textContent, onTextChange]);

  /**
   * Show controls with animation when image is loaded
   */
  useEffect(() => {
    if (currentImage && processedCanvas) {
      // Adaptive delay based on device performance
      const delay = mobileOptimizer.capabilities.isLowEndDevice ? 800 : 500;
      const timer = setTimeout(() => {
        showControlsWithAnimation();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [currentImage, processedCanvas, showControlsWithAnimation, mobileOptimizer.capabilities.isLowEndDevice]);

  /**
   * Cleanup mobile optimizer resources on unmount
   */
  useEffect(() => {
    return () => {
      mobileOptimizer.cleanup();
    };
  }, [mobileOptimizer]);

  /**
   * Update canvas rendering with optimized timing
   */
  useEffect(() => {
    console.log('Canvas render useEffect triggered', { 
      processedCanvas: !!processedCanvas,
      imageMask: !!imageMask,
      currentImage: !!currentImage
    });

    if (processedCanvas && currentImage) {
      console.log('Triggering canvas render from useEffect');
      // Use a small delay to ensure the canvas ref is ready
      const timeoutId = setTimeout(() => {
        renderCanvas();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [renderCanvas, processedCanvas, imageMask, currentImage]);

  // === RENDER ===

  return (
    <div 
      className={`${styles.container} ${className}`} 
      ref={containerRef}
      data-ui-mode={uiMode}
      data-device-type={deviceType}
      data-orientation={orientation}
    >
      {/* Hidden file input with mobile optimization */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/jpeg,image/jpg,image/png,image/webp,image/gif"
        capture="environment" // Prefer rear camera on mobile
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            triggerHapticFeedback('medium');
            handleFileUpload(file);
            // Reset the input value to allow selecting the same file again
            e.target.value = '';
          }
        }}
        style={{ display: 'none' }}
      />

      {/* Mobile Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>📸</span>
            <span className={styles.logoText}>TextBehind</span>
          </div>
        </div>
        
        <div className={styles.headerRight}>
          <button
            className={styles.headerButton}
            onClick={() => {
              triggerHapticFeedback('medium');
              showControls ? hideControlsWithAnimation() : showControlsWithAnimation();
            }}
            title={showControls ? "Hide Controls" : "Show Controls"}
          >
            <span className={styles.buttonIcon}>{showControls ? '🙈' : '👁️'}</span>
          </button>
          
          <button
            className={styles.headerButton}
            onClick={() => {
              triggerHapticFeedback('medium');
              fileInputRef.current?.click();
            }}
            title="Upload Image"
          >
            <span className={styles.buttonIcon}>📁</span>
          </button>
          

        </div>
      </header>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusIndicator}>
          <div className={`${styles.statusDot} ${styles[processingStep]}`} />
          <span className={styles.statusText}>{statusMessage}</span>
          {isProcessing && (
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <span className={styles.progressText}>{processingProgress}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Preview Section */}
      <main 
        className={`${styles.preview} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UserAvatar />
        {!currentImage ? (
          <div 
            className={styles.uploadArea}
            style={{
              transform: `scale(${dragFeedbackScale})`,
              transition: isDragActive ? 'none' : 'transform 0.2s ease'
            }}
            onClick={() => {
              triggerHapticFeedback('medium');
              fileInputRef.current?.click();
            }}
            onTouchStart={handleUploadTouchStart}
            onTouchMove={handleUploadTouchMove}
            onTouchEnd={handleUploadTouchEnd}
          >
            <div className={styles.uploadIcon}>📸</div>
            <div className={styles.uploadTitle}>Tap to add image</div>
            <div className={styles.uploadSubtitle}>Or drag and drop</div>
            <div className={styles.uploadFormats}>JPG, PNG, WebP supported</div>
          </div>
        ) : (
          <div className={styles.canvasContainer}>
            <canvas
              ref={canvasRef}
              className={`${styles.canvas} ${isPinching ? styles.pinching : ''} ${isCanvasPanning ? styles.panning : ''}`}
              style={{
                transform: `translate(${translateX}px, ${translateY}px)`,
                touchAction: 'none' // Prevent default touch behaviors
              }}
              onTouchStart={handleCanvasTouchStart}
              onTouchMove={handleCanvasTouchMove}
              onTouchEnd={handleCanvasTouchEnd}
            />
            
            {/* Zoom Controls */}
            <div className={styles.zoomControls}>
              <button
                className={styles.zoomButton}
                onClick={() => {
                  triggerHapticFeedback('light');
                  setZoomLevel(prev => Math.max(ZOOM_CONSTRAINTS.MIN, prev - ZOOM_CONSTRAINTS.STEP));
                }}
                disabled={zoomLevel <= ZOOM_CONSTRAINTS.MIN}
              >
                -
              </button>
              
              <span className={styles.zoomLevel}>{zoomLevel}%</span>
              
              <button
                className={styles.zoomButton}
                onClick={() => {
                  triggerHapticFeedback('light');
                  setZoomLevel(prev => Math.min(ZOOM_CONSTRAINTS.MAX, prev + ZOOM_CONSTRAINTS.STEP));
                }}
                disabled={zoomLevel >= ZOOM_CONSTRAINTS.MAX}
              >
                +
              </button>
              
              <button
                className={styles.zoomButton}
                onClick={() => {
                  triggerHapticFeedback('medium');
                  setZoomLevel(ZOOM_CONSTRAINTS.DEFAULT);
                  setTranslateX(0);
                  setTranslateY(0);
                }}
              >
                ⌂
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Control Dock with Enhanced Animation */}
      {showControls && (
        <div 
          className={`${styles.controlDock} ${controlsAnimationKey > 1 ? styles.floating : ''}`}
          key={controlsAnimationKey}
        >
        <button
          className={`${styles.dockButton} ${activePanel === 'text' ? styles.active : ''}`}
          onClick={() => togglePanel('text')}
          title="Text Settings"
        >
          <span className={styles.dockIcon}>Aa</span>
          <span className={styles.dockLabel}>Text</span>
        </button>
        
        <button
          className={`${styles.dockButton} ${activePanel === 'position' ? styles.active : ''}`}
          onClick={() => togglePanel('position')}
          title="Position & Effects"
        >
          <span className={styles.dockIcon}>⚡</span>
          <span className={styles.dockLabel}>Effects</span>
        </button>
        
        <button
          className={`${styles.dockButton} ${activePanel === 'pro' ? styles.active : ''}`}
          onClick={() => togglePanel('pro')}
          title="Pro Features"
        >
          <span className={styles.dockIcon}>⭐</span>
          <span className={styles.dockLabel}>Pro</span>
        </button>
        
        <button
          className={`${styles.dockButton} ${styles.disabled}`}
          disabled={true}
          title="AI Agent (Coming Soon)"
        >
          <span className={styles.dockIcon}>🤖</span>
          <span className={styles.dockLabel}>AI Agent</span>
        </button>
        
        <button
          className={styles.dockButton}
          onClick={() => {
            triggerHapticFeedback('heavy');
            handleExport();
          }}
          disabled={!currentImage || isProcessing}
          title="Export Image"
        >
          <span className={styles.dockIcon}>💾</span>
          <span className={styles.dockLabel}>Export</span>
        </button>
        </div>
      )}

      {/* Panel Backdrop */}
      {activePanel && (
        <div 
          className={styles.panelBackdrop}
          onClick={closePanel}
          onTouchEnd={handleBackdropTouch}
        />
      )}

      {/* Text Control Panel */}
      {activePanel === 'text' && (
        <div 
          className={styles.panel}
          style={{
            transform: `translateY(${panelDragY}px)`,
            transition: isPanelDragging ? 'none' : 'transform 0.3s ease'
          }}
          onTouchStart={handlePanelTouchStart}
          onTouchMove={handlePanelTouchMove}
          onTouchEnd={handlePanelTouchEnd}
        >
          <div className={styles.panelHeader}>
            <div className={styles.panelHandle} />
            <h3 className={styles.panelTitle}>
              Text Settings
            </h3>
            <button 
              className={styles.panelClose} 
              onClick={() => {
                triggerHapticFeedback('light');
                closePanel();
              }}
            >
              ×
            </button>
          </div>
          
          <div className={styles.panelContent}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Text Content</label>
              <input
                type="text"
                value={textContent}
                onChange={(e) => handleTextContentChange(e.target.value)}
                className={styles.textInput}
                placeholder="Enter your text..."
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className={styles.select}
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.name} value={font.name}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Font Size
                <span className={styles.value}>{fontSize}px</span>
              </label>
              <input
                type="range"
                min="12"
                max="120"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Text Color</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className={styles.colorPicker}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Style Options</label>
              <div className={styles.toggleGroup}>
                <button
                  className={`${styles.toggleButton} ${isBold ? styles.active : ''}`}
                  onClick={toggleBold}
                >
                  B
                </button>
                <button
                  className={`${styles.toggleButton} ${isItalic ? styles.active : ''}`}
                  onClick={toggleItalic}
                >
                  I
                </button>
                <button
                  className={`${styles.toggleButton} ${isUnderline ? styles.active : ''}`}
                  onClick={toggleUnderline}
                >
                  U
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Position & Effects Panel */}
      {activePanel === 'position' && (
        <div 
          className={styles.panel}
          style={{
            transform: `translateY(${panelDragY}px)`,
            transition: isPanelDragging ? 'none' : 'transform 0.3s ease'
          }}
          onTouchStart={handlePanelTouchStart}
          onTouchMove={handlePanelTouchMove}
          onTouchEnd={handlePanelTouchEnd}
        >
          <div className={styles.panelHeader}>
            <div className={styles.panelHandle} />
            <h3 className={styles.panelTitle}>
              Position & Effects
            </h3>
            <button 
              className={styles.panelClose} 
              onClick={() => {
                triggerHapticFeedback('light');
                closePanel();
              }}
            >
              ×
            </button>
          </div>
          
          <div className={styles.panelContent}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Horizontal Position
                <span className={styles.value}>{horizontalPosition}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={horizontalPosition}
                onChange={(e) => handleHorizontalPositionChange(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Vertical Position
                <span className={styles.value}>{verticalPosition}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={verticalPosition}
                onChange={(e) => handleVerticalPositionChange(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Text Rotation
                <span className={styles.value}>{textRotation}°</span>
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={textRotation}
                onChange={(e) => handleTextRotationChange(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Opacity
                <span className={styles.value}>{textOpacity}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={textOpacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Depth Blur
                <span className={styles.value}>{depthBlur}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={depthBlur}
                onChange={(e) => handleBlurChange(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pro Features Panel */}
      {activePanel === 'pro' && (
        <div 
          className={styles.panel}
          style={{
            transform: `translateY(${panelDragY}px)`,
            transition: isPanelDragging ? 'none' : 'transform 0.3s ease'
          }}
          onTouchStart={handlePanelTouchStart}
          onTouchMove={handlePanelTouchMove}
          onTouchEnd={handlePanelTouchEnd}
        >
          <div className={styles.panelHeader}>
            <div className={styles.panelHandle} />
            <h3 className={styles.panelTitle}>
              Pro Features
            </h3>
            <button 
              className={styles.panelClose} 
              onClick={() => {
                triggerHapticFeedback('light');
                closePanel();
              }}
            >
              ×
            </button>
          </div>
          
          <div className={styles.panelContent}>
            <div className={styles.proContent}>
              <div className={styles.proIcon}>⭐</div>
              <h4 className={styles.proTitle}>Unlock Pro Features</h4>
              <p className={styles.proDescription}>
                Get access to advanced text effects, premium fonts, batch processing, and more!
              </p>
              
              <div className={styles.proFeatures}>
                <div className={styles.proFeature}>✨ Advanced text effects</div>
                <div className={styles.proFeature}>🎨 Premium font library</div>
                <div className={styles.proFeature}>⚡ Batch processing</div>
                <div className={styles.proFeature}>💾 Cloud storage</div>
              </div>
              
              <button 
                className={styles.proButton}
                onClick={() => triggerHapticFeedback('heavy')}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Loading Overlay for Processing */}
      <LoadingOverlay
        isVisible={isProcessing}
        message={statusMessage}
        progress={processingProgress}
        showProgress={true}
        size="large"
        variant="spinner"
        backdrop={true}
      />
    </div>
  );
};