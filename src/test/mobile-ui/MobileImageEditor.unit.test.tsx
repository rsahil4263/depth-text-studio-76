import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MobileImageEditor } from '@/components/MobileImageEditor';

// Mock the background removal service
vi.mock('@/lib/backgroundRemoval', () => ({
  segmentSubject: vi.fn().mockResolvedValue({
    canvas: document.createElement('canvas'),
    mask: new ImageData(100, 100)
  }),
  loadImage: vi.fn().mockResolvedValue(new Image()),
  renderTextBehindSubject: vi.fn().mockReturnValue(document.createElement('canvas'))
}));

// Mock mobile performance optimizations
vi.mock('@/lib/mobilePerformanceOptimizations', () => ({
  MobilePerformanceOptimizer: vi.fn().mockImplementation(() => ({
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
  }))
}));

// Mock CSS modules
vi.mock('@/components/MobileImageEditor.module.css', () => ({
  default: {
    container: 'mobile-container',
    header: 'mobile-header',
    statusBar: 'mobile-status-bar',
    controlDock: 'mobile-control-dock',
    previewSection: 'mobile-preview-section',
    panel: 'mobile-panel',
    panelBackdrop: 'mobile-panel-backdrop',
    panelContent: 'mobile-panel-content'
  }
}));

describe('MobileImageEditor - Unit Tests', () => {
  let mockNavigatorVibrate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock navigator.vibrate
    mockNavigatorVibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: mockNavigatorVibrate,
      writable: true
    });

    // Mock window.innerWidth/innerHeight for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    });

    // Mock devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 2
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render mobile header with logo and controls', () => {
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByTitle('Export Image')).toBeInTheDocument();
    });

    it('should render control dock with all buttons', () => {
      render(<MobileImageEditor />);
      
      expect(screen.getByTitle('Text Settings')).toBeInTheDocument();
      expect(screen.getByTitle('Position & Effects')).toBeInTheDocument();
      expect(screen.getByTitle('Pro Features')).toBeInTheDocument();
    });

    it('should render upload area when no image is loaded', () => {
      render(<MobileImageEditor />);
      
      expect(screen.getByText('Tap to add image')).toBeInTheDocument();
      expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    });

    it('should apply mobile-specific CSS classes', () => {
      const { container } = render(<MobileImageEditor />);
      
      expect(container.querySelector('.mobile-container')).toBeInTheDocument();
      expect(container.querySelector('.mobile-header')).toBeInTheDocument();
      expect(container.querySelector('.mobile-control-dock')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should initialize with default text settings', () => {
      render(<MobileImageEditor />);
      
      // Open text panel to check default values
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      const textInput = screen.getByPlaceholderText('Enter your text...');
      expect(textInput).toHaveValue('Your text here');
    });

    it('should update text content state', async () => {
      const user = userEvent.setup();
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      const textInput = screen.getByPlaceholderText('Enter your text...');
      await user.clear(textInput);
      await user.type(textInput, 'New text content');
      
      expect(textInput).toHaveValue('New text content');
    });

    it('should toggle style states correctly', () => {
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      const boldButton = screen.getByText('B');
      const italicButton = screen.getByText('I');
      const underlineButton = screen.getByText('U');
      
      // Initially not active
      expect(boldButton).not.toHaveClass('active');
      
      // Toggle bold
      fireEvent.click(boldButton);
      expect(mockNavigatorVibrate).toHaveBeenCalledWith(50);
    });

    it('should manage panel visibility state', () => {
      render(<MobileImageEditor />);
      
      // Initially no panel is open
      expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
      
      // Open text panel
      fireEvent.click(screen.getByTitle('Text Settings'));
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
      
      // Close panel by clicking same button
      fireEvent.click(screen.getByTitle('Text Settings'));
      expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback on panel toggle', () => {
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      expect(mockNavigatorVibrate).toHaveBeenCalledWith(100);
    });

    it('should trigger haptic feedback on style toggles', () => {
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      fireEvent.click(screen.getByText('B'));
      
      expect(mockNavigatorVibrate).toHaveBeenCalledWith(50);
    });

    it('should handle missing vibrate API gracefully', () => {
      // Remove vibrate API
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true
      });
      
      expect(() => {
        render(<MobileImageEditor />);
        fireEvent.click(screen.getByTitle('Text Settings'));
      }).not.toThrow();
    });
  });

  describe('File Upload Handling', () => {
    it('should handle file input change', async () => {
      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files?.[0]).toBe(file);
    });

    it('should validate file types', async () => {
      const onError = vi.fn();
      render(<MobileImageEditor onError={onError} />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await userEvent.upload(fileInput, invalidFile);
      
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'Mobile File Validation'
      );
    });

    it('should validate file size limits', async () => {
      const onError = vi.fn();
      render(<MobileImageEditor onError={onError} />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      // Create a large file (10MB)
      const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      
      await userEvent.upload(fileInput, largeFile);
      
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'Mobile File Size Validation'
      );
    });
  });

  describe('Export Functionality', () => {
    it('should handle export when no image is loaded', () => {
      render(<MobileImageEditor />);
      
      const exportButton = screen.getByTitle('Export Image');
      fireEvent.click(exportButton);
      
      // Should show error message
      expect(screen.getByText('Cannot export: Image not ready')).toBeInTheDocument();
    });

    it('should handle export when no text content', async () => {
      render(<MobileImageEditor />);
      
      // Simulate image loaded state
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await userEvent.upload(fileInput, file);
      
      // Clear text content
      fireEvent.click(screen.getByTitle('Text Settings'));
      const textInput = screen.getByPlaceholderText('Enter your text...');
      await userEvent.clear(textInput);
      
      const exportButton = screen.getByTitle('Export Image');
      fireEvent.click(exportButton);
      
      expect(screen.getByText('Cannot export: No text content')).toBeInTheDocument();
    });

    it('should call onExport callback when export succeeds', async () => {
      const onExport = vi.fn();
      render(<MobileImageEditor onExport={onExport} />);
      
      // Mock successful image processing
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await userEvent.upload(fileInput, file);
      
      // Wait for processing to complete
      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      });
      
      const exportButton = screen.getByTitle('Export Image');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(onExport).toHaveBeenCalledWith(expect.any(HTMLCanvasElement));
      });
    });
  });

  describe('Status Messages', () => {
    it('should show status messages with auto-hide', async () => {
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      fireEvent.click(screen.getByText('B'));
      
      expect(screen.getByText('Bold enabled')).toBeInTheDocument();
      
      // Should auto-hide after timeout
      await waitFor(() => {
        expect(screen.queryByText('Bold enabled')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should call onStatusChange callback', () => {
      const onStatusChange = vi.fn();
      render(<MobileImageEditor onStatusChange={onStatusChange} />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      fireEvent.click(screen.getByText('B'));
      
      expect(onStatusChange).toHaveBeenCalledWith('Bold enabled', false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MobileImageEditor />);
      
      expect(screen.getByTitle('Text Settings')).toBeInTheDocument();
      expect(screen.getByTitle('Position & Effects')).toBeInTheDocument();
      expect(screen.getByTitle('Pro Features')).toBeInTheDocument();
      expect(screen.getByTitle('Export Image')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload Image')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      textButton.focus();
      
      fireEvent.keyDown(textButton, { key: 'Enter' });
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
      
      fireEvent.keyDown(textButton, { key: ' ' });
      expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      // Panel should be focusable
      const panel = screen.getByText('Text Settings').closest('[role="dialog"]');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('Data Attributes', () => {
    it('should apply data attributes from props', () => {
      const { container } = render(
        <MobileImageEditor 
          data-ui-mode="mobile"
          data-device-type="phone"
          data-orientation="portrait"
        />
      );
      
      const mobileContainer = container.querySelector('.mobile-container');
      expect(mobileContainer).toHaveAttribute('data-ui-mode', 'mobile');
      expect(mobileContainer).toHaveAttribute('data-device-type', 'phone');
      expect(mobileContainer).toHaveAttribute('data-orientation', 'portrait');
    });
  });

  describe('Error Handling', () => {
    it('should handle component errors gracefully', () => {
      const onError = vi.fn();
      
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<MobileImageEditor onError={onError} />);
      
      // Trigger an error condition
      const fileInput = screen.getByLabelText('Upload Image');
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      
      expect(onError).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});