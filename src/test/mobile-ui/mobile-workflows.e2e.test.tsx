import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MobileImageEditor } from '@/components/MobileImageEditor';

// Mock dependencies for E2E-style testing
vi.mock('@/lib/backgroundRemoval', () => ({
  segmentSubject: vi.fn(),
  loadImage: vi.fn(),
  renderTextBehindSubject: vi.fn()
}));

vi.mock('@/lib/mobilePerformanceOptimizations', () => ({
  MobilePerformanceOptimizer: vi.fn().mockImplementation(() => ({
    capabilities: { isMobile: true, isLowEndDevice: false },
    debouncer: {
      debounce: vi.fn((key, fn) => fn),
      throttle: vi.fn((key, fn) => fn),
      smartDebounce: vi.fn((key, fn) => fn),
      clearAll: vi.fn()
    },
    canvasManager: { getCanvas: vi.fn(), cleanup: vi.fn() },
    animationManager: { requestAnimationFrame: vi.fn() },
    batteryOptimizer: { shouldReduceQuality: vi.fn(() => false) },
    getOptimizationConfig: vi.fn(() => ({})),
    logPerformanceStats: vi.fn(),
    cleanup: vi.fn()
  }))
}));

vi.mock('@/components/MobileImageEditor.module.css', () => ({
  default: {
    container: 'mobile-container',
    panel: 'mobile-panel',
    panelContent: 'mobile-panel-content'
  }
}));

import { segmentSubject, loadImage, renderTextBehindSubject } from '@/lib/backgroundRemoval';

describe('Mobile UI - End-to-End Workflows', () => {
  let mockSegmentSubject: ReturnType<typeof vi.fn>;
  let mockLoadImage: ReturnType<typeof vi.fn>;
  let mockRenderTextBehindSubject: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSegmentSubject = vi.mocked(segmentSubject);
    mockLoadImage = vi.mocked(loadImage);
    mockRenderTextBehindSubject = vi.mocked(renderTextBehindSubject);

    // Setup successful responses
    const mockCanvas = document.createElement('canvas');
    const mockImage = new Image();
    const mockImageData = new ImageData(100, 100);

    mockLoadImage.mockResolvedValue(mockImage);
    mockSegmentSubject.mockResolvedValue({
      canvas: mockCanvas,
      mask: mockImageData
    });
    mockRenderTextBehindSubject.mockReturnValue(mockCanvas);

    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true
    });

    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

    // Mock canvas toBlob for export
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      const blob = new Blob(['mock-image-data'], { type: 'image/png' });
      callback(blob);
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document.createElement for download link
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName) => {
      if (tagName === 'a') {
        const link = originalCreateElement.call(document, 'a');
        link.click = vi.fn();
        return link;
      }
      return originalCreateElement.call(document, tagName);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Complete Image Processing Workflow', () => {
    it('should complete full workflow: upload → process → edit → export', async () => {
      const user = userEvent.setup();
      render(<MobileImageEditor />);

      // Step 1: Upload image
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);

      // Verify upload initiated
      expect(mockLoadImage).toHaveBeenCalledWith(file);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });

      // Step 2: Edit text content
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      const textInput = screen.getByPlaceholderText('Enter your text...');
      await user.clear(textInput);
      await user.type(textInput, 'My Custom Text');

      expect(textInput).toHaveValue('My Custom Text');

      // Step 3: Adjust text styling
      fireEvent.click(screen.getByText('B')); // Bold
      fireEvent.click(screen.getByText('I')); // Italic

      // Step 4: Adjust position
      fireEvent.click(screen.getByTitle('Position & Effects'));
      
      const horizontalSlider = screen.getByRole('slider', { name: /horizontal/i });
      fireEvent.change(horizontalSlider, { target: { value: '75' } });

      const opacitySlider = screen.getByRole('slider', { name: /opacity/i });
      fireEvent.change(opacitySlider, { target: { value: '90' } });

      // Step 5: Export image
      const exportButton = screen.getByTitle('Export Image');
      fireEvent.click(exportButton);

      // Verify export process
      await waitFor(() => {
        expect(mockRenderTextBehindSubject).toHaveBeenCalledWith(
          expect.any(HTMLCanvasElement),
          expect.any(ImageData),
          'My Custom Text',
          expect.objectContaining({
            bold: true,
            italic: true,
            x: expect.any(Number),
            opacity: 90
          })
        );
      });

      // Verify download initiated
      await waitFor(() => {
        expect(screen.getByText(/Export complete!/)).toBeInTheDocument();
      });
    });

    it('should handle workflow interruption and recovery', async () => {
      const user = userEvent.setup();
      render(<MobileImageEditor />);

      // Start upload
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);

      // Simulate processing error
      mockSegmentSubject.mockRejectedValueOnce(new Error('Processing failed'));

      // Wait for error to be handled
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      // Retry with successful processing
      mockSegmentSubject.mockResolvedValueOnce({
        canvas: document.createElement('canvas'),
        mask: new ImageData(100, 100)
      });

      // Upload again
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Panel Navigation Workflow', () => {
    it('should navigate through all panels and maintain state', async () => {
      const user = userEvent.setup();
      render(<MobileImageEditor />);

      // Upload image first
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });

      // Navigate to text panel
      fireEvent.click(screen.getByTitle('Text Settings'));
      expect(screen.getByText('Text Settings')).toBeInTheDocument();

      // Edit text
      const textInput = screen.getByPlaceholderText('Enter your text...');
      await user.clear(textInput);
      await user.type(textInput, 'Panel Test');

      // Navigate to position panel
      fireEvent.click(screen.getByTitle('Position & Effects'));
      expect(screen.getByText('Position & Effects')).toBeInTheDocument();
      expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();

      // Adjust position
      const horizontalSlider = screen.getByRole('slider', { name: /horizontal/i });
      fireEvent.change(horizontalSlider, { target: { value: '60' } });

      // Navigate to pro panel
      fireEvent.click(screen.getByTitle('Pro Features'));
      expect(screen.getByText('Pro Features')).toBeInTheDocument();
      expect(screen.queryByText('Position & Effects')).not.toBeInTheDocument();

      // Go back to text panel - state should be preserved
      fireEvent.click(screen.getByTitle('Text Settings'));
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
      
      const preservedTextInput = screen.getByPlaceholderText('Enter your text...');
      expect(preservedTextInput).toHaveValue('Panel Test');

      // Go back to position panel - state should be preserved
      fireEvent.click(screen.getByTitle('Position & Effects'));
      const preservedSlider = screen.getByRole('slider', { name: /horizontal/i });
      expect(preservedSlider).toHaveValue('60');
    });

    it('should handle panel closing via swipe gesture', () => {
      render(<MobileImageEditor />);

      // Open text panel
      fireEvent.click(screen.getByTitle('Text Settings'));
      expect(screen.getByText('Text Settings')).toBeInTheDocument();

      const panelContent = screen.getByText('Text Content').closest('.mobile-panel-content');

      if (panelContent) {
        // Swipe down to close
        fireEvent.touchStart(panelContent, {
          touches: [{ clientY: 100 }]
        });

        fireEvent.touchMove(panelContent, {
          touches: [{ clientY: 250 }] // 150px swipe
        });

        fireEvent.touchEnd(panelContent);

        // Panel should close
        expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
      }
    });

    it('should handle panel closing via backdrop tap', () => {
      render(<MobileImageEditor />);

      // Open text panel
      fireEvent.click(screen.getByTitle('Text Settings'));
      expect(screen.getByText('Text Settings')).toBeInTheDocument();

      // Click backdrop
      const backdrop = document.querySelector('.mobile-panel-backdrop');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
      }
    });
  });

  describe('Touch Interaction Workflows', () => {
    it('should handle canvas zoom and pan workflow', async () => {
      const user = userEvent.setup();
      render(<MobileImageEditor />);

      // Upload image
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });

      const canvasContainer = document.querySelector('.mobile-container');

      if (canvasContainer) {
        // Pinch to zoom
        fireEvent.touchStart(canvasContainer, {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ]
        });

        fireEvent.touchMove(canvasContainer, {
          touches: [
            { clientX: 80, clientY: 80 },
            { clientX: 220, clientY: 220 }
          ]
        });

        fireEvent.touchEnd(canvasContainer);

        // Pan gesture
        fireEvent.touchStart(canvasContainer, {
          touches: [{ clientX: 150, clientY: 150 }]
        });

        fireEvent.touchMove(canvasContainer, {
          touches: [{ clientX: 200, clientY: 200 }]
        });

        fireEvent.touchEnd(canvasContainer);

        // Should handle gestures without crashing
        expect(canvasContainer).toBeInTheDocument();
      }
    });

    it('should handle upload area touch workflow', () => {
      render(<MobileImageEditor />);

      const uploadArea = screen.getByText('Tap to add image').closest('div');
      const fileInput = screen.getByLabelText('Upload Image') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});

      if (uploadArea) {
        // Touch and drag to trigger upload
        fireEvent.touchStart(uploadArea, {
          touches: [{ clientX: 100, clientY: 100 }]
        });

        fireEvent.touchMove(uploadArea, {
          touches: [{ clientX: 200, clientY: 200 }]
        });

        fireEvent.touchEnd(uploadArea);

        expect(clickSpy).toHaveBeenCalled();
      }

      clickSpy.mockRestore();
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover from upload errors and allow retry', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      render(<MobileImageEditor onError={onError} />);

      // Try to upload invalid file
      const fileInput = screen.getByLabelText('Upload Image');
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await user.upload(fileInput, invalidFile);

      // Should show error
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'Mobile File Validation'
      );

      // Try again with valid file
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, validFile);

      // Should process successfully
      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });
    });

    it('should handle processing errors and allow retry', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();
      render(<MobileImageEditor onError={onError} />);

      // Mock processing failure
      mockSegmentSubject.mockRejectedValueOnce(new Error('Processing failed'));

      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);

      // Should handle error
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.any(Error),
          'Mobile Image Processing'
        );
      });

      // Reset mock for successful retry
      mockSegmentSubject.mockResolvedValueOnce({
        canvas: document.createElement('canvas'),
        mask: new ImageData(100, 100)
      });

      // Retry upload
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });
    });

    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup();
      render(<MobileImageEditor />);

      // Upload and process image
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });

      // Mock export failure
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
        callback(null); // Simulate blob creation failure
      });

      const exportButton = screen.getByTitle('Export Image');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export failed')).toBeInTheDocument();
      });
    });
  });

  describe('Multi-Step Editing Workflows', () => {
    it('should handle complex text styling workflow', async () => {
      const user = userEvent.setup();
      render(<MobileImageEditor />);

      // Upload image
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });

      // Open text panel and edit content
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      const textInput = screen.getByPlaceholderText('Enter your text...');
      await user.clear(textInput);
      await user.type(textInput, 'Styled Text');

      // Apply multiple styles
      fireEvent.click(screen.getByText('B')); // Bold
      fireEvent.click(screen.getByText('I')); // Italic
      fireEvent.click(screen.getByText('U')); // Underline

      // Change font size
      const fontSizeSlider = screen.getByRole('slider', { name: /font size/i });
      fireEvent.change(fontSizeSlider, { target: { value: '64' } });

      // Change color (if color picker is available)
      const colorInput = screen.queryByRole('textbox', { name: /color/i });
      if (colorInput) {
        fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      }

      // Switch to position panel
      fireEvent.click(screen.getByTitle('Position & Effects'));

      // Adjust position
      const horizontalSlider = screen.getByRole('slider', { name: /horizontal/i });
      fireEvent.change(horizontalSlider, { target: { value: '25' } });

      const verticalSlider = screen.getByRole('slider', { name: /vertical/i });
      fireEvent.change(verticalSlider, { target: { value: '75' } });

      // Adjust effects
      const opacitySlider = screen.getByRole('slider', { name: /opacity/i });
      fireEvent.change(opacitySlider, { target: { value: '85' } });

      const blurSlider = screen.getByRole('slider', { name: /blur/i });
      fireEvent.change(blurSlider, { target: { value: '5' } });

      // Export with all settings
      const exportButton = screen.getByTitle('Export Image');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockRenderTextBehindSubject).toHaveBeenCalledWith(
          expect.any(HTMLCanvasElement),
          expect.any(ImageData),
          'Styled Text',
          expect.objectContaining({
            fontSize: 64,
            bold: true,
            italic: true,
            underline: true,
            opacity: 85,
            blur: 5
          })
        );
      });
    });

    it('should handle rapid successive edits efficiently', async () => {
      const user = userEvent.setup();
      render(<MobileImageEditor />);

      // Upload image
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });

      // Open text panel
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      const textInput = screen.getByPlaceholderText('Enter your text...');

      // Rapid text changes
      for (let i = 0; i < 10; i++) {
        await user.clear(textInput);
        await user.type(textInput, `Text ${i}`);
      }

      // Should handle rapid changes without crashing
      expect(textInput).toHaveValue('Text 9');

      // Rapid style toggles
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByText('B'));
        fireEvent.click(screen.getByText('I'));
      }

      // Should still be functional
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple simultaneous touch events', () => {
      render(<MobileImageEditor />);

      const container = document.querySelector('.mobile-container');

      if (container) {
        // Simulate multiple rapid touch events
        for (let i = 0; i < 20; i++) {
          fireEvent.touchStart(container, {
            touches: [{ clientX: 100 + i, clientY: 100 + i }]
          });
          
          fireEvent.touchMove(container, {
            touches: [{ clientX: 120 + i, clientY: 120 + i }]
          });
          
          fireEvent.touchEnd(container);
        }

        // Should handle all events without crashing
        expect(container).toBeInTheDocument();
      }
    });

    it('should handle rapid panel switching', () => {
      render(<MobileImageEditor />);

      // Rapidly switch between panels
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByTitle('Text Settings'));
        fireEvent.click(screen.getByTitle('Position & Effects'));
        fireEvent.click(screen.getByTitle('Pro Features'));
      }

      // Should end up with pro panel open
      expect(screen.getByText('Pro Features')).toBeInTheDocument();
    });
  });
});