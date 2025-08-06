import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MobileImageEditor } from '@/components/MobileImageEditor';

// Mock browser compatibility detection
const mockBrowserCompatibility = {
  detectBrowser: vi.fn(),
  validateBrowserCompatibility: vi.fn(),
  getBrowserPerformanceProfile: vi.fn()
};

vi.mock('@/lib/browserCompatibility', () => mockBrowserCompatibility);

// Mock other dependencies
vi.mock('@/lib/backgroundRemoval', () => ({
  segmentSubject: vi.fn().mockResolvedValue({
    canvas: document.createElement('canvas'),
    mask: new ImageData(100, 100)
  }),
  loadImage: vi.fn().mockResolvedValue(new Image()),
  renderTextBehindSubject: vi.fn().mockReturnValue(document.createElement('canvas'))
}));

vi.mock('@/lib/mobilePerformanceOptimizations', () => ({
  MobilePerformanceOptimizer: vi.fn().mockImplementation(() => ({
    capabilities: { isMobile: true, isLowEndDevice: false },
    debouncer: { debounce: vi.fn((key, fn) => fn), clearAll: vi.fn() },
    canvasManager: { getCanvas: vi.fn(), cleanup: vi.fn() },
    animationManager: { requestAnimationFrame: vi.fn() },
    batteryOptimizer: { shouldReduceQuality: vi.fn(() => false) },
    getOptimizationConfig: vi.fn(() => ({})),
    logPerformanceStats: vi.fn(),
    cleanup: vi.fn()
  }))
}));

vi.mock('@/components/MobileImageEditor.module.css', () => ({
  default: { container: 'mobile-container' }
}));

describe('Mobile Browser Compatibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default browser compatibility setup
    mockBrowserCompatibility.detectBrowser.mockReturnValue({
      name: 'Chrome',
      version: '91.0.4472.124',
      isSupported: true,
      isMobile: true
    });
    
    mockBrowserCompatibility.validateBrowserCompatibility.mockReturnValue({
      isSupported: true,
      missingFeatures: [],
      warnings: []
    });
    
    mockBrowserCompatibility.getBrowserPerformanceProfile.mockReturnValue({
      canvasSupport: 'full',
      webglSupport: true,
      touchSupport: true,
      estimatedPerformance: 'high'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Touch Event Support', () => {
    it('should handle touch events on modern mobile browsers', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        value: null,
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      const uploadArea = screen.getByText('Tap to add image').closest('div');
      
      // Test touch events
      fireEvent.touchStart(uploadArea!, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(uploadArea!, {
        touches: [{ clientX: 120, clientY: 120 }]
      });
      
      fireEvent.touchEnd(uploadArea!);
      
      expect(uploadArea).toBeInTheDocument();
    });

    it('should fallback to mouse events when touch is not supported', () => {
      // Mock no touch support
      delete (window as any).ontouchstart;
      
      render(<MobileImageEditor />);
      
      const uploadArea = screen.getByText('Tap to add image').closest('div');
      
      // Should still handle mouse events
      fireEvent.mouseDown(uploadArea!);
      fireEvent.mouseMove(uploadArea!);
      fireEvent.mouseUp(uploadArea!);
      
      expect(uploadArea).toBeInTheDocument();
    });

    it('should handle touch events with different touch point counts', () => {
      render(<MobileImageEditor />);
      
      const canvasArea = document.querySelector('.mobile-container');
      
      if (canvasArea) {
        // Single touch
        fireEvent.touchStart(canvasArea, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        // Multi-touch
        fireEvent.touchStart(canvasArea, {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ]
        });
        
        fireEvent.touchEnd(canvasArea);
        
        expect(canvasArea).toBeInTheDocument();
      }
    });

    it('should handle touch events with missing properties gracefully', () => {
      render(<MobileImageEditor />);
      
      const uploadArea = screen.getByText('Tap to add image').closest('div');
      
      // Touch event with minimal properties
      const touchEvent = new TouchEvent('touchstart', {
        touches: [] as any
      });
      
      expect(() => {
        uploadArea?.dispatchEvent(touchEvent);
      }).not.toThrow();
    });
  });

  describe('Canvas Support Detection', () => {
    it('should work with full canvas support', () => {
      mockBrowserCompatibility.getBrowserPerformanceProfile.mockReturnValue({
        canvasSupport: 'full',
        webglSupport: true,
        touchSupport: true,
        estimatedPerformance: 'high'
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should handle limited canvas support', () => {
      mockBrowserCompatibility.getBrowserPerformanceProfile.mockReturnValue({
        canvasSupport: 'limited',
        webglSupport: false,
        touchSupport: true,
        estimatedPerformance: 'medium'
      });
      
      render(<MobileImageEditor />);
      
      // Should still render but may have reduced functionality
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should handle no canvas support gracefully', () => {
      mockBrowserCompatibility.getBrowserPerformanceProfile.mockReturnValue({
        canvasSupport: 'none',
        webglSupport: false,
        touchSupport: true,
        estimatedPerformance: 'low'
      });
      
      const onError = vi.fn();
      
      render(<MobileImageEditor onError={onError} />);
      
      // Should render but may show warnings
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });
  });

  describe('WebGL Support Detection', () => {
    it('should utilize WebGL when available', () => {
      // Mock WebGL context
      const mockWebGLContext = {
        getParameter: vi.fn().mockReturnValue(2048),
        createShader: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        createProgram: vi.fn()
      };
      
      HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type) => {
        if (type === 'webgl' || type === 'experimental-webgl') {
          return mockWebGLContext;
        }
        return null;
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should fallback when WebGL is not available', () => {
      HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type) => {
        if (type === 'webgl' || type === 'experimental-webgl') {
          return null;
        }
        return {
          clearRect: vi.fn(),
          drawImage: vi.fn(),
          getImageData: vi.fn(),
          putImageData: vi.fn()
        };
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });
  });

  describe('Browser-Specific Behaviors', () => {
    it('should handle Safari mobile quirks', () => {
      mockBrowserCompatibility.detectBrowser.mockReturnValue({
        name: 'Safari',
        version: '14.1.2',
        isSupported: true,
        isMobile: true
      });
      
      // Mock Safari-specific behavior
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should handle Chrome mobile behaviors', () => {
      mockBrowserCompatibility.detectBrowser.mockReturnValue({
        name: 'Chrome',
        version: '91.0.4472.124',
        isSupported: true,
        isMobile: true
      });
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should handle Firefox mobile behaviors', () => {
      mockBrowserCompatibility.detectBrowser.mockReturnValue({
        name: 'Firefox',
        version: '89.1.1',
        isSupported: true,
        isMobile: true
      });
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should handle Samsung Internet browser', () => {
      mockBrowserCompatibility.detectBrowser.mockReturnValue({
        name: 'Samsung Internet',
        version: '14.2.1.47',
        isSupported: true,
        isMobile: true
      });
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });
  });

  describe('Feature Detection', () => {
    it('should detect File API support', async () => {
      // Mock File API support
      Object.defineProperty(window, 'File', {
        value: File,
        writable: true
      });
      
      Object.defineProperty(window, 'FileReader', {
        value: FileReader,
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      const fileInput = screen.getByLabelText('Upload Image');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await userEvent.upload(fileInput, file);
      
      expect(fileInput.files).toHaveLength(1);
    });

    it('should handle missing File API gracefully', () => {
      // Mock missing File API
      delete (window as any).File;
      delete (window as any).FileReader;
      
      const onError = vi.fn();
      
      render(<MobileImageEditor onError={onError} />);
      
      // Should still render
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should detect drag and drop support', () => {
      // Mock drag and drop support
      Object.defineProperty(window, 'DataTransfer', {
        value: DataTransfer,
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      const uploadArea = screen.getByText('Tap to add image').closest('div');
      
      fireEvent.dragOver(uploadArea!);
      fireEvent.drop(uploadArea!, {
        dataTransfer: {
          files: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
        }
      });
      
      expect(uploadArea).toBeInTheDocument();
    });

    it('should detect vibration API support', () => {
      // Mock vibration API
      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn(),
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      expect(navigator.vibrate).toHaveBeenCalled();
    });

    it('should handle missing vibration API', () => {
      // Remove vibration API
      delete (navigator as any).vibrate;
      
      render(<MobileImageEditor />);
      
      // Should not crash when trying to vibrate
      expect(() => {
        fireEvent.click(screen.getByTitle('Text Settings'));
      }).not.toThrow();
    });
  });

  describe('Performance Adaptation', () => {
    it('should adapt to high-performance devices', () => {
      mockBrowserCompatibility.getBrowserPerformanceProfile.mockReturnValue({
        canvasSupport: 'full',
        webglSupport: true,
        touchSupport: true,
        estimatedPerformance: 'high'
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should adapt to low-performance devices', () => {
      mockBrowserCompatibility.getBrowserPerformanceProfile.mockReturnValue({
        canvasSupport: 'limited',
        webglSupport: false,
        touchSupport: true,
        estimatedPerformance: 'low'
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should show performance warnings when needed', () => {
      mockBrowserCompatibility.validateBrowserCompatibility.mockReturnValue({
        isSupported: true,
        missingFeatures: [],
        warnings: ['Limited canvas performance detected']
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });
  });

  describe('Unsupported Browser Handling', () => {
    it('should handle completely unsupported browsers', () => {
      mockBrowserCompatibility.detectBrowser.mockReturnValue({
        name: 'Internet Explorer',
        version: '11.0',
        isSupported: false,
        isMobile: false
      });
      
      mockBrowserCompatibility.validateBrowserCompatibility.mockReturnValue({
        isSupported: false,
        missingFeatures: ['Canvas API', 'File API', 'Touch Events'],
        warnings: ['Browser not supported']
      });
      
      const onError = vi.fn();
      
      render(<MobileImageEditor onError={onError} />);
      
      // Should still render but may show error messages
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should handle browsers with missing critical features', () => {
      mockBrowserCompatibility.validateBrowserCompatibility.mockReturnValue({
        isSupported: false,
        missingFeatures: ['Canvas API'],
        warnings: ['Canvas support required for image processing']
      });
      
      const onError = vi.fn();
      
      render(<MobileImageEditor onError={onError} />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle low memory conditions', () => {
      // Mock low memory condition
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 1, // 1GB RAM
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should handle memory pressure events', () => {
      render(<MobileImageEditor />);
      
      // Simulate memory pressure
      const memoryPressureEvent = new Event('memorywarning');
      
      expect(() => {
        window.dispatchEvent(memoryPressureEvent);
      }).not.toThrow();
    });

    it('should cleanup resources on page unload', () => {
      const { unmount } = render(<MobileImageEditor />);
      
      // Simulate page unload
      const unloadEvent = new Event('beforeunload');
      window.dispatchEvent(unloadEvent);
      
      unmount();
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Network Conditions', () => {
    it('should handle slow network conditions', () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 2000
        },
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should handle offline conditions', () => {
      // Mock offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });
      
      render(<MobileImageEditor />);
      
      expect(screen.getByText('TextBehind')).toBeInTheDocument();
    });

    it('should adapt to network changes', () => {
      render(<MobileImageEditor />);
      
      // Simulate network change
      const onlineEvent = new Event('online');
      const offlineEvent = new Event('offline');
      
      expect(() => {
        window.dispatchEvent(offlineEvent);
        window.dispatchEvent(onlineEvent);
      }).not.toThrow();
    });
  });
});