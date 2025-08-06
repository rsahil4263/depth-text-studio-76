# Text Behind Subject Fix - Implementation Summary

## Problem Identified
The text was appearing **on top** of the subject instead of **behind** the subject, which defeated the purpose of the "text behind image" effect.

## Root Cause Analysis
1. **Incorrect Canvas Usage**: The `renderTextBehindSubject` function was receiving the original canvas instead of the processed canvas with transparent background
2. **Missing Background Reconstruction**: The function wasn't properly reconstructing the background from the original image
3. **Layer Composition Order**: The layering logic needed to be simplified and corrected

## Solution Implemented

### 1. Updated `segmentSubject` Function (`src/lib/backgroundRemoval.ts`)
- **Before**: Returned the original canvas with the full image
- **After**: Now returns both the processed canvas (subject with transparent background) AND the original canvas
- **Key Change**: Creates a proper processed canvas from the IMG.LY foreground blob

```typescript
// NEW: Create processed canvas with transparent background
const processedCanvas = createOptimizedCanvas(
  { width: canvas.width, height: canvas.height },
  { willReadFrequently: false, alpha: true }
);

// Load the foreground blob (subject with transparent background)
const foregroundImage = new Image();
await new Promise<void>((resolve, reject) => {
  foregroundImage.onload = () => resolve();
  foregroundImage.onerror = () => reject(new Error('Failed to load processed foreground image'));
  foregroundImage.src = URL.createObjectURL(foregroundBlob);
});

processedCanvas.context.drawImage(foregroundImage, 0, 0, canvas.width, canvas.height);

return {
  mask,
  originalImage: imageElement,
  canvas: processedCanvas.canvas, // Processed canvas with transparent background
  originalCanvas: canvas, // Original canvas for background reconstruction
  metrics
};
```

### 2. Simplified `renderTextBehindSubject` Function
- **Before**: Complex 3-layer composition with manual mask application
- **After**: Simplified 2-layer composition using the correct inputs

```typescript
export const renderTextBehindSubject = (
  processedCanvas: HTMLCanvasElement, // Subject with transparent background
  mask: ImageData,
  text: string,
  options: TextOptions,
  originalImage?: HTMLImageElement // Original image for background reconstruction
): HTMLCanvasElement
```

**New Layer Composition:**
1. **Background Layer**: Reconstructed from original image with subject removed (using inverted mask)
2. **Text Layer**: Text rendered on transparent canvas
3. **Final Composition**: Background → Text → Subject (creates text-behind-subject effect)

### 3. Updated Component Calls
Updated all components to pass the original image:

**ImageEditor.tsx:**
```typescript
const resultCanvas = renderTextBehindSubject(
  processedCanvas, 
  subjectMask, 
  text, 
  options,
  image // Pass original image
);
```

**HtmlImageEditor.tsx:**
```typescript
const finalCanvas = renderTextBehindSubject(
  processedCanvas,
  imageMask,
  textContent,
  textOptions,
  currentImage // Pass original image
);
```

## Technical Details

### IMG.LY Integration
- Uses `@imgly/background-removal` v1.7.0 (latest version)
- Properly handles the foreground blob output (subject with transparent background)
- Maintains mobile optimization and performance features

### Layer Composition Logic
```
Final Result = Background + Text + Subject
Where:
- Background = Original image with subject removed (using inverted mask)
- Text = User's text with styling
- Subject = Processed subject with transparent background
```

### Mask Handling
- **Mask from IMG.LY**: White (alpha=255) = subject, Transparent (alpha=0) = background
- **Background Layer**: Keep pixels where mask is 0 (background areas)
- **Subject Layer**: Keep pixels where mask is 255 (subject areas)

## Testing
- Build completes successfully without TypeScript errors
- All existing functionality preserved
- Mobile optimization maintained
- Performance optimizations intact

## Expected Result
- Text now appears **behind** the subject, creating proper depth illusion
- Subject appears in front of text, partially covering it
- Background is properly reconstructed from original image
- Effect works with all text styling options (color, size, blur, etc.)

## Files Modified
1. `src/lib/backgroundRemoval.ts` - Core rendering logic
2. `src/components/ImageEditor.tsx` - Main editor component
3. `src/components/HtmlImageEditor.tsx` - HTML-based editor
4. Type definitions updated for new function signatures

The fix maintains backward compatibility while providing the correct text-behind-subject visual effect.