# Design Document

## Overview

This design outlines the replacement of the current Hugging Face transformers.js-based background removal system with the @imgly/background-removal library. The new implementation will provide faster, more accurate background removal while maintaining the existing "text behind image" functionality. The solution leverages WebAssembly for high-performance client-side processing and requires specific CORS headers for proper operation.

## Architecture

### Current Architecture Analysis

The existing system uses:
- `@huggingface/transformers` with the Xenova/segformer-b0-finetuned-ade-512-512 model
- Complex segmentation logic that identifies background classes vs. foreground objects
- Manual mask combination and fallback logic for undetected subjects
- Canvas-based image processing pipeline

### New Architecture Design

The new system will:
- Replace transformers.js with `@imgly/background-removal` library
- Simplify the processing pipeline by leveraging the library's built-in subject detection
- Maintain the same public API interface for seamless integration
- Use WebAssembly for improved performance
- Require CORS headers for proper WebAssembly execution

### Key Architectural Changes

1. **Library Replacement**: Direct substitution of the ML processing engine
2. **Simplified Processing**: Remove complex segmentation logic in favor of library's built-in capabilities
3. **Performance Optimization**: Leverage WebAssembly for faster processing
4. **Error Handling Enhancement**: Implement robust error handling with user-friendly messages
5. **Configuration Updates**: Add required CORS headers to Vite configuration

## Components and Interfaces

### Core Service Interface

```typescript
// New background removal service interface
interface BackgroundRemovalService {
  processImage(imageSource: File | Blob | string): Promise<Blob>;
  loadImage(file: Blob): Promise<HTMLImageElement>;
}
```

### Updated Background Removal Module

**File**: `src/lib/backgroundRemoval.ts`

The module will be restructured to:
- Remove all transformers.js imports and dependencies
- Implement new `removeBackground()` function using @imgly/background-removal
- Maintain existing `loadImage()` and `renderTextBehindSubject()` functions
- Update `segmentSubject()` to use the new background removal approach
- Add proper error handling and loading states

### Integration Points

**File**: `src/components/ImageEditor.tsx`

The ImageEditor component integration will:
- Continue using the same `segmentSubject()` function call
- Maintain existing loading state management
- Preserve current error handling patterns
- Keep the same user interface flow

### Configuration Updates

**File**: `vite.config.ts`

Add CORS headers configuration:
```typescript
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  }
}
```

## Data Models

### Input/Output Models

```typescript
// Input types (unchanged)
type ImageSource = File | Blob | HTMLImageElement;

// Processing result (simplified)
interface BackgroundRemovalResult {
  mask: ImageData;
  originalImage: HTMLImageElement;
  canvas: HTMLCanvasElement;
}

// New internal processing result
interface ImglyProcessingResult {
  foregroundBlob: Blob;
  originalImage: HTMLImageElement;
}
```

### Processing Pipeline

1. **Input Processing**: Accept File/Blob/HTMLImageElement
2. **Background Removal**: Use @imgly/background-removal to generate foreground-only image
3. **Mask Generation**: Convert foreground image to mask data for existing rendering pipeline
4. **Canvas Preparation**: Maintain compatibility with existing text rendering system

## Error Handling

### Error Categories

1. **Library Loading Errors**: WebAssembly or library initialization failures
2. **Image Processing Errors**: Invalid image formats or processing failures
3. **Memory Errors**: Large image processing on resource-constrained devices
4. **Network Errors**: Model download or initialization issues

### Error Handling Strategy

```typescript
interface ErrorHandlingStrategy {
  // User-friendly error messages
  getErrorMessage(error: Error): string;
  
  // Graceful degradation options
  shouldRetry(error: Error): boolean;
  
  // Fallback mechanisms
  getFallbackOptions(error: Error): FallbackOption[];
}
```

### Error Recovery

- Display clear, actionable error messages to users
- Provide retry mechanisms for transient failures
- Maintain application stability during processing failures
- Log detailed error information for debugging

## Testing Strategy

### Unit Testing

1. **Background Removal Service Tests**
   - Test successful image processing with various image formats
   - Test error handling for invalid inputs
   - Test performance with different image sizes
   - Mock @imgly/background-removal for isolated testing

2. **Integration Tests**
   - Test ImageEditor component with new background removal
   - Test complete user workflow from upload to text rendering
   - Test error states and user feedback

3. **Performance Tests**
   - Measure processing time improvements vs. transformers.js
   - Test memory usage with large images
   - Test performance on different device types

### Browser Compatibility Testing

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Test Data Requirements

- Various image formats (PNG, JPG, JPEG)
- Different image sizes (small, medium, large)
- Complex backgrounds (busy scenes, similar colors)
- Simple backgrounds (solid colors, gradients)
- Edge cases (very small images, very large images)

## Implementation Phases

### Phase 1: Library Integration
- Install @imgly/background-removal package
- Update Vite configuration with CORS headers
- Create new background removal service wrapper

### Phase 2: Core Functionality
- Implement new `removeBackground()` function
- Update `segmentSubject()` to use new library
- Maintain backward compatibility with existing interfaces

### Phase 3: Integration & Testing
- Update ImageEditor component integration
- Implement comprehensive error handling
- Add loading state improvements

### Phase 4: Cleanup & Optimization
- Remove transformers.js dependencies
- Clean up unused code and model files
- Optimize bundle size and performance

## Performance Considerations

### Expected Improvements
- **Processing Time**: Target 50%+ reduction in processing time
- **Memory Usage**: More efficient WebAssembly implementation
- **Bundle Size**: Smaller specialized library vs. general-purpose transformers.js
- **Device Compatibility**: Better performance on mobile devices

### Performance Monitoring
- Track processing time metrics
- Monitor error rates across different devices
- Measure user satisfaction with processing speed

## Security Considerations

### CORS Headers
- Required for WebAssembly execution
- Properly configured to maintain security
- Limited to necessary origins and methods

### Client-Side Processing
- All processing remains client-side
- No image data transmitted to external servers
- User privacy maintained through local processing

## Migration Strategy

### Backward Compatibility
- Maintain existing public API interfaces
- Preserve current user experience flow
- Ensure seamless transition for existing users

### Rollback Plan
- Keep transformers.js code in version control until migration is confirmed stable
- Implement feature flags for easy rollback if needed
- Monitor error rates and performance metrics post-deployment

## Dependencies

### New Dependencies
- `@imgly/background-removal`: Core background removal library
- WebAssembly runtime (included with library)

### Removed Dependencies
- `@huggingface/transformers`: Remove after successful migration
- Related ONNX runtime dependencies
- Model files and caching utilities

## Browser Support Requirements

### Minimum Requirements
- WebAssembly support (available in all modern browsers)
- Canvas API support
- File API support
- Modern JavaScript features (ES2020+)

### Graceful Degradation
- Clear error messages for unsupported browsers
- Fallback recommendations for users on older browsers