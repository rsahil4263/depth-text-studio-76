import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MobileImageEditor } from '@/components/MobileImageEditor';
import { segmentSubject, loadImage, renderTextBehindSubject } from '@/lib/backgroundRemoval';
import { MobilePerformanceOptimizer } from '@/lib/mobilePerformanceOptimizations';

// Mock the services
vi.mock('@/lib/backgroundRemoval');
vi.mock('@/lib/mobilePerformanceOptimizations');

// Mock CSS modules
vi.mock('@/components/MobileImageEditor.module.css', () => ({
  default: {
    container: 'mobile-container',
    statusBar: 'mobile-status-bar'
  }
}));

describe('Mobile Services Integration Tests', () => {
  let mockSegmentSubject: ReturnType<typeof vi.fn>;
  let mockLoadImage: ReturnType<typeof vi.fn>;
  let mockRenderTextBehindSubject: ReturnType<typeof vi.fn>;
  let mockPerformanceOptimizer: any;

  beforeEach(() => {
    // Mock background removal services
    mockSegmentSubject = vi.mocked(segmentSubject);
    mockLoadImage = vi.mocked(loadImage);
    mockRenderTextBehindSubject = vi.mocked(renderTextBehindSubject);

    // Mock performance optimizer
    mockPerformanceOptimizer = {
      capabilities: {
        isMobile: true,
        isLowEndDevice: false,
        hasHardwareAcceleration: true,
        maxTextureSize: 2048,
        devicePixelRatio: 2,
        estimatedRAM: 4096,
        batteryLevel: 80,
        isCharging: true
      },
      debouncer: {
        debounce: vi.fn((key, fn) => fn),
        throttle: vi.fn((key, fn) => fn),
        smartDebounce: vi.fn((key, fn) => fn),
        clearAll: vi.fn()
      },
      canvasManager: {
        getCanvas: vi.fn().mockReturnValue(document.createElement('canvas')),
        returnCanvas: vi.fn(),
        cleanup: vi.fn(),
        getMemoryStats: vi.fn().mockReturnValue({ poolSize: 0, estimatedMemoryMB: 0 })
      },
      animationManager: {
        requestAnimationFrame: vi.fn((cb) => requestAnimationFrame(cb)),
        getOptimizedDuration: vi.fn((duration) => duration),
        getOptimizedEasing: vi.fn(() => 'ease-out')
      },
      batteryOptimizer: {
        getPerformanceMode: vi.fn(() => 'high'),
        getBatteryOptimizedConfig: vi.fn(() => ({})),
        shouldReduceQuality: vi.fn(() => false),
        shouldSkipAnimations: vi.fn(() => false)
      },
      getOptimizationConfig: vi.fn(() => ({
        maxDimension: 1024,
        maxFileSize: 8 * 1024 * 1024,
        qualityThreshold: 0.85,
        memoryThreshold: 80
      })),
      logPerformanceStats: vi.fn(),
      cleanup: vi.fn()
    };

    vi.mocked(MobilePerformanceOptimizer).mockImplementation(() => mockPerformanceOptimizer);

    // Setup default successful responses
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Background Removal Service Integration', () => {
    it('should integrate with loadImage service', async () => {
      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mockLoadImage).toHaveBeenCalledWith(file);
      });
    });

    it('should integrate with segmentSubject service', async () => {
      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mockSegmentSubject).toHaveBeenCalledWith(
          expect.any(Image),
          expect.any(Function) // Progress callback
        );
      });
    });

    it('should handle progress updates during segmentation', async () => {
      let progressCallback: ((progress: number) => void) | undefined;
      
      mockSegmentSubject.mockImplementation((image, callback) => {
        progressCallback = callback;
        return Promise.resolve({
          canvas: document.createElement('canvas'),
          mask: new ImageData(100, 100)
        });
      });

      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(progressCallback).toBeDefined();
      });

      // Simulate progress updates
      if (progressCallback) {
        progressCallback(25);
        expect(screen.getByText(/Processing.*25%/)).toBeInTheDocument();
        
        progressCallback(50);
        expect(screen.getByText(/Processing.*50%/)).toBeInTheDocument();
        
        progressCallback(100);
        await waitFor(() => {
          expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
        });
      }
    });

    it('should integrate with renderTextBehindSubject for export', async () => {
      render(<MobileImageEditor />);
      
      // Upload and process image
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText('Image loaded successfully!')).toBeInTheDocument();
      });
      
      // Trigger export
      const exportButton = screen.getByTitle('Export Image');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockRenderTextBehindSubject).toHaveBeenCalledWith(
          expect.any(HTMLCanvasElement),
          expect.any(ImageData),
          expect.any(String),
          expect.objectContaining({
            fontSize: expect.any(Number),
            fontFamily: expect.any(String),
            color: expect.any(String),
            opacity: expect.any(Number),
            x: expect.any(Number),
            y: expect.any(Number),
            blur: expect.any(Number),
            bold: expect.any(Boolean),
            italic: expect.any(Boolean),
            underline: expect.any(Boolean)
          })
        );
      });
    });

    it('should handle background removal service errors', async () => {
      const onError = vi.fn();
      mockLoadImage.mockRejectedValue(new Error('Failed to load image'));
      
      render(<MobileImageEditor onError={onError} />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.any(Error),
          'Mobile Image Processing'
        );
      });
    });

    it('should handle segmentation service errors', async () => {
      const onError = vi.fn();
      mockSegmentSubject.mockRejectedValue(new Error('Segmentation failed'));
      
      render(<MobileImageEditor onError={onError} />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.any(Error),
          'Mobile Image Processing'
        );
      });
    });
  });

  describe('Mobile Performance Optimizer Integration', () => {
    it('should initialize performance optimizer', () => {
      render(<MobileImageEditor />);
      
      expect(MobilePerformanceOptimizer).toHaveBeenCalled();
      expect(mockPerformanceOptimizer.logPerformanceStats).toHaveBeenCalled();
    });

    it('should use debounced text updates', async () => {
      render(<MobileImageEditor />);
      
      // Open text panel
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      const textInput = screen.getByPlaceholderText('Enter your text...');
      await userEvent.type(textInput, 'New text');
      
      expect(mockPerformanceOptimizer.debouncer.debounce).toHaveBeenCalledWith(
        'textUpdate',
        expect.any(Function)
      );
    });

    it('should use throttled slider updates', () => {
      render(<MobileImageEditor />);
      
      // Open position panel
      fireEvent.click(screen.getByTitle('Position & Effects'));
      
      const opacitySlider = screen.getByRole('slider', { name: /opacity/i });
      fireEvent.change(opacitySlider, { target: { value: '75' } });
      
      expect(mockPerformanceOptimizer.debouncer.throttle).toHaveBeenCalledWith(
        'sliderUpdate',
        expect.any(Function)
      );
    });

    it('should use smart debounced position updates', () => {
      render(<MobileImageEditor />);
      
      // Open position panel
      fireEvent.click(screen.getByTitle('Position & Effects'));
      
      const horizontalSlider = screen.getByRole('slider', { name: /horizontal/i });
      fireEvent.change(horizontalSlider, { target: { value: '60' } });
      
      expect(mockPerformanceOptimizer.debouncer.smartDebounce).toHaveBeenCalledWith(
        'positionUpdate',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should apply mobile-optimized file size limits', async () => {
      const onError = vi.fn();
      
      // Configure for low-end device
      mockPerformanceOptimizer.capabilities.isLowEndDevice = true;
      mockPerformanceOptimizer.getOptimizationConfig.mockReturnValue({
        maxFileSize: 3 * 1024 * 1024 // 3MB for low-end device
      });
      
      render(<MobileImageEditor onError={onError} />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      // Create 5MB file (should exceed low-end device limit)
      const largeFile = new File([new ArrayBuffer(5 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      
      await userEvent.upload(fileInput, largeFile);
      
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('File too large')
        }),
        'Mobile File Size Validation'
      );
    });

    it('should adapt to battery status', async () => {
      // Configure battery saver mode
      mockPerformanceOptimizer.capabilities.batteryLevel = 15;
      mockPerformanceOptimizer.capabilities.isCharging = false;
      mockPerformanceOptimizer.batteryOptimizer.shouldReduceQuality.mockReturnValue(true);
      
      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      // Should show faster progress indication in battery saver mode
      await waitFor(() => {
        expect(mockPerformanceOptimizer.batteryOptimizer.shouldReduceQuality).toHaveBeenCalled();
      });
    });

    it('should cleanup performance optimizer on unmount', () => {
      const { unmount } = render(<MobileImageEditor />);
      
      unmount();
      
      expect(mockPerformanceOptimizer.cleanup).toHaveBeenCalled();
    });
  });

  describe('Canvas Manager Integration', () => {
    it('should use canvas manager for canvas operations', async () => {
      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mockPerformanceOptimizer.canvasManager.getCanvas).toHaveBeenCalled();
      });
    });

    it('should return canvases to pool for reuse', async () => {
      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      // Process multiple images to trigger canvas reuse
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      await userEvent.upload(fileInput, file2);
      
      await waitFor(() => {
        expect(mockPerformanceOptimizer.canvasManager.returnCanvas).toHaveBeenCalled();
      });
    });
  });

  describe('Animation Manager Integration', () => {
    it('should use optimized animation timing', () => {
      render(<MobileImageEditor />);
      
      // Trigger an animation (panel open)
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      expect(mockPerformanceOptimizer.animationManager.getOptimizedDuration).toHaveBeenCalled();
      expect(mockPerformanceOptimizer.animationManager.getOptimizedEasing).toHaveBeenCalled();
    });

    it('should use mobile-optimized requestAnimationFrame', () => {
      render(<MobileImageEditor />);
      
      // Trigger canvas rendering
      fireEvent.click(screen.getByTitle('Text Settings'));
      const textInput = screen.getByPlaceholderText('Enter your text...');
      fireEvent.change(textInput, { target: { value: 'Test' } });
      
      expect(mockPerformanceOptimizer.animationManager.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Battery Optimizer Integration', () => {
    it('should check battery status for performance mode', () => {
      render(<MobileImageEditor />);
      
      expect(mockPerformanceOptimizer.batteryOptimizer.getPerformanceMode).toHaveBeenCalled();
    });

    it('should skip animations in battery saver mode', () => {
      mockPerformanceOptimizer.batteryOptimizer.shouldSkipAnimations.mockReturnValue(true);
      
      render(<MobileImageEditor />);
      
      // Trigger animation
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      expect(mockPerformanceOptimizer.batteryOptimizer.shouldSkipAnimations).toHaveBeenCalled();
    });

    it('should reduce quality in battery saver mode', async () => {
      mockPerformanceOptimizer.batteryOptimizer.shouldReduceQuality.mockReturnValue(true);
      
      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      expect(mockPerformanceOptimizer.batteryOptimizer.shouldReduceQuality).toHaveBeenCalled();
    });
  });

  describe('Service Error Recovery', () => {
    it('should handle service initialization failures', () => {
      vi.mocked(MobilePerformanceOptimizer).mockImplementation(() => {
        throw new Error('Performance optimizer failed');
      });
      
      const onError = vi.fn();
      
      expect(() => {
        render(<MobileImageEditor onError={onError} />);
      }).not.toThrow();
    });

    it('should handle canvas manager failures', async () => {
      mockPerformanceOptimizer.canvasManager.getCanvas.mockImplementation(() => {
        throw new Error('Canvas creation failed');
      });
      
      const onError = vi.fn();
      render(<MobileImageEditor onError={onError} />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should handle debouncer failures gracefully', () => {
      mockPerformanceOptimizer.debouncer.debounce.mockImplementation(() => {
        throw new Error('Debouncer failed');
      });
      
      render(<MobileImageEditor />);
      
      // Should not crash when debouncer fails
      fireEvent.click(screen.getByTitle('Text Settings'));
      const textInput = screen.getByPlaceholderText('Enter your text...');
      
      expect(() => {
        fireEvent.change(textInput, { target: { value: 'Test' } });
      }).not.toThrow();
    });
  });

  describe('Memory Management Integration', () => {
    it('should log performance stats', () => {
      render(<MobileImageEditor />);
      
      expect(mockPerformanceOptimizer.logPerformanceStats).toHaveBeenCalled();
    });

    it('should get memory statistics', async () => {
      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mockPerformanceOptimizer.canvasManager.getMemoryStats).toHaveBeenCalled();
      });
    });

    it('should cleanup resources on component unmount', () => {
      const { unmount } = render(<MobileImageEditor />);
      
      unmount();
      
      expect(mockPerformanceOptimizer.cleanup).toHaveBeenCalled();
      expect(mockPerformanceOptimizer.debouncer.clearAll).toHaveBeenCalled();
      expect(mockPerformanceOptimizer.canvasManager.cleanup).toHaveBeenCalled();
    });
  });
});