# Design Document

## Overview

This design document outlines the comprehensive redesign of the Text Behind Image application's user interface. The new design transforms the current React-based UI into a modern, Perplexity-style interface that maintains all existing functionality while providing a significantly enhanced user experience. The design follows a dark theme aesthetic with professional styling, smooth animations, and intuitive interactions.

The redesign will be implemented as a React component that wraps the provided HTML/CSS/JavaScript structure, ensuring seamless integration with the existing application architecture while preserving all AI background removal, image processing, and export capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application Layer                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   App.tsx       │  │   Index.tsx     │  │  Router/Toast   │ │
│  │   (Main App)    │  │   (Page)        │  │  (Providers)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  New UI Component Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              HtmlImageEditor.tsx                        │ │
│  │  ┌─────────────────┐  ┌─────────────────┐              │ │
│  │  │   HTML/CSS      │  │   JavaScript    │              │ │
│  │  │   Structure     │  │   Logic         │              │ │
│  │  └─────────────────┘  └─────────────────┘              │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Service Integration Layer                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Background     │  │  Text Behind    │  │  Browser        │ │
│  │  Removal        │  │  Image Service  │  │  Compatibility  │ │
│  │  Service        │  │                 │  │  Service        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The new UI will be implemented as a single React component (`HtmlImageEditor`) that:

1. **Renders HTML Structure**: Injects the provided HTML structure into the React DOM
2. **Applies CSS Styles**: Includes the complete CSS styling as component-scoped styles
3. **Initializes JavaScript**: Sets up all event listeners and interactive functionality
4. **Integrates Services**: Connects to existing background removal and image processing services
5. **Manages State**: Handles all UI state and user interactions

## Components and Interfaces

### Core Component Structure

#### HtmlImageEditor Component

```typescript
interface HtmlImageEditorProps {
  // Optional props for future extensibility
  className?: string;
  onImageLoad?: (image: HTMLImageElement) => void;
  onTextChange?: (text: string) => void;
  onExport?: (canvas: HTMLCanvasElement) => void;
}

interface HtmlImageEditorState {
  // Image processing state
  currentImage: HTMLImageElement | null;
  isProcessing: boolean;
  processingStep: 'loading' | 'processing' | 'converting' | 'complete' | 'error';
  processingProgress: number;
  
  // Text editing state
  text: string;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  textOpacity: number;
  horizontalPosition: number;
  verticalPosition: number;
  depthBlur: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  
  // Canvas interaction state
  zoomLevel: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  
  // UI state
  statusMessage: string;
  isDragOver: boolean;
}
```

### Layout Structure

#### Sidebar (Left Panel - 340px)

```
┌─────────────────────────────────────┐
│              Logo Area              │
├─────────────────────────────────────┤
│           Text Settings             │
│  • Text Content Input               │
│  • Font Family Selector             │
│  • Font Size Slider                 │
│  • Style Toggles (B/I/U)            │
│  • Color Picker                     │
├─────────────────────────────────────┤
│        Position & Effects           │
│  • Horizontal Position Slider       │
│  • Vertical Position Slider         │
│  • Opacity Slider                   │
│  • Depth Blur Slider                │
├─────────────────────────────────────┤
│           Export Section            │
│  • Download Image Button            │
│  • Upload New Image Button          │
└─────────────────────────────────────┘
```

#### Main Content Area (Flexible Width)

```
┌─────────────────────────────────────────────────────────────┐
│                    Status Indicator                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │              Viewport Container                         │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │                                                     │ │ │
│  │  │               Canvas Area                           │ │ │
│  │  │  • Upload Area (when no image)                     │ │ │
│  │  │  • Image + Text Overlay (when loaded)              │ │ │
│  │  │                                                     │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│  Zoom Controls                           Zoom Indicator      │
└─────────────────────────────────────────────────────────────┘
```

### Service Integration Points

#### Background Removal Integration

```typescript
// Integration with existing backgroundRemoval service
import { segmentSubject, loadImage, renderTextBehindSubject } from "@/lib/backgroundRemoval";

// Usage in new UI
const processImage = async (file: File) => {
  const img = await loadImage(file);
  const segmentResult = await segmentSubject(img, updateProgress);
  const resultCanvas = renderTextBehindSubject(
    segmentResult.canvas, 
    segmentResult.mask, 
    textSettings
  );
  displayResult(resultCanvas);
};
```

#### Browser Compatibility Integration

```typescript
// Integration with existing browser compatibility service
import { 
  detectBrowser, 
  validateBrowserCompatibility, 
  getBrowserPerformanceProfile 
} from "@/lib/browserCompatibility";

// Usage in new UI
const initializeBrowserSupport = () => {
  const browserInfo = detectBrowser();
  const performanceProfile = getBrowserPerformanceProfile();
  updateUIForBrowser(browserInfo, performanceProfile);
};
```

#### Error Handling Integration

```typescript
// Integration with existing error handling
import { 
  handleBackgroundRemovalError, 
  BackgroundRemovalError 
} from "@/lib/errorHandling";

// Usage in new UI
const handleProcessingError = (error: Error) => {
  const structuredError = handleBackgroundRemovalError(error, 'UI Processing');
  updateStatusMessage(structuredError.userMessage);
  showErrorState(structuredError);
};
```

## Data Models

### Text Settings Model

```typescript
interface TextSettings {
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  position: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
  effects: {
    blur: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
}
```

### Canvas State Model

```typescript
interface CanvasState {
  image: HTMLImageElement | null;
  dimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  viewport: {
    zoom: number;
    translateX: number;
    translateY: number;
  };
  interaction: {
    isDragging: boolean;
    lastMousePosition: { x: number; y: number };
  };
}
```

### Processing State Model

```typescript
interface ProcessingState {
  isActive: boolean;
  step: 'loading' | 'processing' | 'converting' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  startTime: number;
  duration: number;
  error?: BackgroundRemovalError;
}
```

## Error Handling

### Error Categories

1. **Image Loading Errors**
   - Invalid file format
   - File too large
   - Corrupted image data

2. **Processing Errors**
   - AI service failures
   - Memory limitations
   - Browser compatibility issues

3. **Canvas Rendering Errors**
   - Context creation failures
   - Drawing operation errors
   - Export failures

4. **User Interaction Errors**
   - Invalid input values
   - Drag and drop failures
   - Keyboard shortcut conflicts

### Error Handling Strategy

```typescript
// Centralized error handling approach
const handleError = (error: Error, context: string) => {
  // Use existing error handling service
  const structuredError = handleBackgroundRemovalError(error, context);
  
  // Update UI state
  setProcessingStep('error');
  setStatusMessage(structuredError.userMessage);
  
  // Show recovery options if available
  if (structuredError.retryable) {
    showRetryOption();
  }
  
  // Log for debugging
  console.error(`UI Error [${context}]:`, structuredError);
};
```

### User Feedback Mechanisms

1. **Status Indicators**: Real-time processing status with progress bars
2. **Toast Notifications**: Success/error messages using existing toast system
3. **Visual Feedback**: Hover states, loading animations, drag indicators
4. **Recovery Guidance**: Clear instructions for error resolution

## Testing Strategy

### Unit Testing Approach

1. **Component Testing**
   - Render testing with different props
   - Event handler testing
   - State management testing
   - Integration with React lifecycle

2. **Service Integration Testing**
   - Background removal service calls
   - Error handling scenarios
   - Browser compatibility checks
   - Canvas operations

3. **User Interaction Testing**
   - Drag and drop functionality
   - Keyboard shortcuts
   - Zoom and pan operations
   - Text editing controls

### Integration Testing

1. **End-to-End Workflows**
   - Complete image processing pipeline
   - Text editing and positioning
   - Export functionality
   - Error recovery flows

2. **Cross-Browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Different screen sizes
   - Performance validation
   - Accessibility compliance

### Testing Implementation

```typescript
// Example test structure
describe('HtmlImageEditor', () => {
  describe('Image Processing', () => {
    it('should load and process images correctly', async () => {
      // Test image loading
      // Test AI processing integration
      // Test canvas rendering
    });
    
    it('should handle processing errors gracefully', async () => {
      // Test error scenarios
      // Test error recovery
      // Test user feedback
    });
  });
  
  describe('Text Editing', () => {
    it('should update text properties in real-time', () => {
      // Test text input changes
      // Test style toggles
      // Test position sliders
    });
  });
  
  describe('Canvas Interactions', () => {
    it('should support zoom and pan operations', () => {
      // Test zoom controls
      // Test mouse interactions
      // Test keyboard shortcuts
    });
  });
});
```

### Performance Testing

1. **Load Testing**
   - Large image processing
   - Memory usage monitoring
   - Processing time benchmarks

2. **Responsiveness Testing**
   - UI interaction latency
   - Animation smoothness
   - Real-time updates

3. **Browser Performance**
   - Cross-browser performance comparison
   - Memory leak detection
   - CPU usage optimization

## Implementation Approach

### Phase 1: Core Structure Setup

1. Create `HtmlImageEditor` React component
2. Inject HTML structure and CSS styles
3. Set up basic event listeners
4. Implement file upload functionality

### Phase 2: Service Integration

1. Connect to existing background removal service
2. Integrate browser compatibility checks
3. Implement error handling
4. Add progress tracking

### Phase 3: Interactive Features

1. Implement text editing controls
2. Add zoom and pan functionality
3. Create export functionality
4. Add keyboard shortcuts

### Phase 4: Polish and Optimization

1. Add animations and transitions
2. Optimize performance
3. Enhance accessibility
4. Cross-browser testing

### Migration Strategy

The new UI will be implemented as a drop-in replacement for the existing `ImageEditor` component:

1. **Parallel Development**: Build new component alongside existing one
2. **Feature Parity**: Ensure all existing functionality is preserved
3. **Gradual Rollout**: Test thoroughly before replacing existing component
4. **Fallback Option**: Keep existing component as backup during transition

This design ensures a smooth transition while delivering a significantly enhanced user experience that maintains all existing functionality and integrates seamlessly with the current application architecture.