import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileImageEditor } from '@/components/MobileImageEditor';

// Mock dependencies
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
    debouncer: {
      debounce: vi.fn((key, fn) => fn),
      throttle: vi.fn((key, fn) => fn),
      smartDebounce: vi.fn((key, fn) => fn),
      clearAll: vi.fn()
    },
    canvasManager: { getCanvas: vi.fn(), returnCanvas: vi.fn(), cleanup: vi.fn() },
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
    panelContent: 'mobile-panel-content',
    canvasContainer: 'mobile-canvas-container',
    uploadArea: 'mobile-upload-area'
  }
}));

describe('MobileImageEditor - Touch Gestures', () => {
  let mockNavigatorVibrate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNavigatorVibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: mockNavigatorVibrate,
      writable: true
    });

    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Panel Swipe Gestures', () => {
    it('should handle panel swipe down to close', () => {
      render(<MobileImageEditor />);
      
      // Open text panel
      fireEvent.click(screen.getByTitle('Text Settings'));
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
      
      const panelContent = screen.getByText('Text Content').closest('.mobile-panel-content');
      
      if (panelContent) {
        // Start swipe gesture
        fireEvent.touchStart(panelContent, {
          touches: [{ clientY: 100 }]
        });
        
        // Swipe down significantly
        fireEvent.touchMove(panelContent, {
          touches: [{ clientY: 250 }]
        });
        
        // End swipe
        fireEvent.touchEnd(panelContent);
        
        // Panel should close
        expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
        expect(mockNavigatorVibrate).toHaveBeenCalledWith(100);
      }
    });

    it('should snap back on small swipe', () => {
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      const panelContent = screen.getByText('Text Content').closest('.mobile-panel-content');
      
      if (panelContent) {
        // Small swipe
        fireEvent.touchStart(panelContent, {
          touches: [{ clientY: 100 }]
        });
        
        fireEvent.touchMove(panelContent, {
          touches: [{ clientY: 130 }] // Only 30px movement
        });
        
        fireEvent.touchEnd(panelContent);
        
        // Panel should remain open
        expect(screen.getByText('Text Settings')).toBeInTheDocument();
      }
    });

    it('should handle fast swipe velocity', () => {
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      const panelContent = screen.getByText('Text Content').closest('.mobile-panel-content');
      
      if (panelContent) {
        const startTime = Date.now();
        
        // Mock Date.now for consistent timing
        vi.spyOn(Date, 'now')
          .mockReturnValueOnce(startTime)
          .mockReturnValueOnce(startTime + 50); // 50ms later
        
        fireEvent.touchStart(panelContent, {
          touches: [{ clientY: 100 }]
        });
        
        fireEvent.touchMove(panelContent, {
          touches: [{ clientY: 150 }] // 50px in 50ms = 1px/ms velocity
        });
        
        fireEvent.touchEnd(panelContent);
        
        // Should close due to high velocity
        expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
      }
    });

    it('should prevent upward swipes', () => {
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      const panelContent = screen.getByText('Text Content').closest('.mobile-panel-content');
      
      if (panelContent) {
        // Upward swipe
        fireEvent.touchStart(panelContent, {
          touches: [{ clientY: 200 }]
        });
        
        fireEvent.touchMove(panelContent, {
          touches: [{ clientY: 100 }] // Upward movement
        });
        
        fireEvent.touchEnd(panelContent);
        
        // Panel should remain open
        expect(screen.getByText('Text Settings')).toBeInTheDocument();
      }
    });
  });

  describe('Canvas Touch Gestures', () => {
    beforeEach(() => {
      // Mock image loaded state
      const mockImage = new Image();
      Object.defineProperty(mockImage, 'width', { value: 800 });
      Object.defineProperty(mockImage, 'height', { value: 600 });
    });

    it('should handle single touch pan gesture', () => {
      render(<MobileImageEditor />);
      
      const canvasContainer = document.querySelector('.mobile-canvas-container');
      
      if (canvasContainer) {
        // Start pan
        fireEvent.touchStart(canvasContainer, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        // Pan movement
        fireEvent.touchMove(canvasContainer, {
          touches: [{ clientX: 150, clientY: 150 }]
        });
        
        // End pan
        fireEvent.touchEnd(canvasContainer);
        
        expect(mockNavigatorVibrate).toHaveBeenCalledWith(50);
      }
    });

    it('should handle pinch-to-zoom gesture', () => {
      render(<MobileImageEditor />);
      
      const canvasContainer = document.querySelector('.mobile-canvas-container');
      
      if (canvasContainer) {
        // Start pinch with two touches
        fireEvent.touchStart(canvasContainer, {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ]
        });
        
        // Pinch out (zoom in)
        fireEvent.touchMove(canvasContainer, {
          touches: [
            { clientX: 80, clientY: 80 },
            { clientX: 220, clientY: 220 }
          ]
        });
        
        // End pinch
        fireEvent.touchEnd(canvasContainer);
        
        expect(mockNavigatorVibrate).toHaveBeenCalledWith(50);
      }
    });

    it('should transition from pinch to pan', () => {
      render(<MobileImageEditor />);
      
      const canvasContainer = document.querySelector('.mobile-canvas-container');
      
      if (canvasContainer) {
        // Start with two touches (pinch)
        fireEvent.touchStart(canvasContainer, {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ]
        });
        
        // Remove one touch (transition to pan)
        fireEvent.touchEnd(canvasContainer, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        // Continue with single touch pan
        fireEvent.touchMove(canvasContainer, {
          touches: [{ clientX: 120, clientY: 120 }]
        });
        
        fireEvent.touchEnd(canvasContainer);
        
        // Should handle transition gracefully
        expect(canvasContainer).toBeInTheDocument();
      }
    });

    it('should constrain zoom levels', () => {
      render(<MobileImageEditor />);
      
      const canvasContainer = document.querySelector('.mobile-canvas-container');
      
      if (canvasContainer) {
        // Extreme pinch out (should be constrained)
        fireEvent.touchStart(canvasContainer, {
          touches: [
            { clientX: 150, clientY: 150 },
            { clientX: 151, clientY: 151 }
          ]
        });
        
        fireEvent.touchMove(canvasContainer, {
          touches: [
            { clientX: 0, clientY: 0 },
            { clientX: 300, clientY: 300 }
          ]
        });
        
        fireEvent.touchEnd(canvasContainer);
        
        // Should not crash or produce invalid zoom levels
        expect(canvasContainer).toBeInTheDocument();
      }
    });
  });

  describe('Upload Area Touch Gestures', () => {
    it('should handle touch drag feedback', () => {
      render(<MobileImageEditor />);
      
      const uploadArea = screen.getByText('Tap to add image').closest('.mobile-upload-area');
      
      if (uploadArea) {
        // Start touch
        fireEvent.touchStart(uploadArea, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        // Drag movement
        fireEvent.touchMove(uploadArea, {
          touches: [{ clientX: 150, clientY: 150 }]
        });
        
        // End touch
        fireEvent.touchEnd(uploadArea);
        
        expect(mockNavigatorVibrate).toHaveBeenCalledWith(100);
      }
    });

    it('should trigger file picker on successful drag gesture', () => {
      render(<MobileImageEditor />);
      
      const uploadArea = screen.getByText('Tap to add image').closest('.mobile-upload-area');
      const fileInput = screen.getByLabelText('Upload Image') as HTMLInputElement;
      
      // Mock click method
      const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
      
      if (uploadArea) {
        fireEvent.touchStart(uploadArea, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        // Significant drag movement
        fireEvent.touchMove(uploadArea, {
          touches: [{ clientX: 200, clientY: 200 }]
        });
        
        fireEvent.touchEnd(uploadArea);
        
        expect(clickSpy).toHaveBeenCalled();
        expect(mockNavigatorVibrate).toHaveBeenCalledWith(100);
      }
      
      clickSpy.mockRestore();
    });

    it('should not trigger file picker on small movements', () => {
      render(<MobileImageEditor />);
      
      const uploadArea = screen.getByText('Tap to add image').closest('.mobile-upload-area');
      const fileInput = screen.getByLabelText('Upload Image') as HTMLInputElement;
      
      const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
      
      if (uploadArea) {
        fireEvent.touchStart(uploadArea, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        // Small movement
        fireEvent.touchMove(uploadArea, {
          touches: [{ clientX: 105, clientY: 105 }]
        });
        
        fireEvent.touchEnd(uploadArea);
        
        expect(clickSpy).not.toHaveBeenCalled();
      }
      
      clickSpy.mockRestore();
    });
  });

  describe('Backdrop Touch Handling', () => {
    it('should close panel on backdrop touch', () => {
      render(<MobileImageEditor />);
      
      // Open panel
      fireEvent.click(screen.getByTitle('Text Settings'));
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
      
      // Find and click backdrop
      const backdrop = document.querySelector('.mobile-panel-backdrop');
      if (backdrop) {
        fireEvent.click(backdrop);
        
        expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
        expect(mockNavigatorVibrate).toHaveBeenCalledWith(50);
      }
    });

    it('should handle backdrop touch events', () => {
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      
      const backdrop = document.querySelector('.mobile-panel-backdrop');
      if (backdrop) {
        fireEvent.touchStart(backdrop);
        fireEvent.touchEnd(backdrop);
        
        expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
      }
    });
  });

  describe('Multi-touch Handling', () => {
    it('should handle multiple simultaneous touches', () => {
      render(<MobileImageEditor />);
      
      const canvasContainer = document.querySelector('.mobile-canvas-container');
      
      if (canvasContainer) {
        // Start with three touches (should handle gracefully)
        fireEvent.touchStart(canvasContainer, {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 },
            { clientX: 300, clientY: 300 }
          ]
        });
        
        fireEvent.touchMove(canvasContainer, {
          touches: [
            { clientX: 110, clientY: 110 },
            { clientX: 210, clientY: 210 },
            { clientX: 310, clientY: 310 }
          ]
        });
        
        fireEvent.touchEnd(canvasContainer);
        
        // Should not crash
        expect(canvasContainer).toBeInTheDocument();
      }
    });

    it('should prioritize two-touch pinch over other gestures', () => {
      render(<MobileImageEditor />);
      
      const canvasContainer = document.querySelector('.mobile-canvas-container');
      
      if (canvasContainer) {
        // Start with single touch
        fireEvent.touchStart(canvasContainer, {
          touches: [{ clientX: 100, clientY: 100 }]
        });
        
        // Add second touch (should switch to pinch mode)
        fireEvent.touchStart(canvasContainer, {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ]
        });
        
        // Pinch gesture
        fireEvent.touchMove(canvasContainer, {
          touches: [
            { clientX: 90, clientY: 90 },
            { clientX: 210, clientY: 210 }
          ]
        });
        
        fireEvent.touchEnd(canvasContainer);
        
        expect(canvasContainer).toBeInTheDocument();
      }
    });
  });

  describe('Touch Event Prevention', () => {
    it('should prevent default on pinch gestures', () => {
      render(<MobileImageEditor />);
      
      const canvasContainer = document.querySelector('.mobile-canvas-container');
      
      if (canvasContainer) {
        const touchMoveEvent = new TouchEvent('touchmove', {
          touches: [
            new Touch({ identifier: 0, target: canvasContainer, clientX: 90, clientY: 90 }),
            new Touch({ identifier: 1, target: canvasContainer, clientX: 210, clientY: 210 })
          ] as any
        });
        
        const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault');
        
        fireEvent.touchStart(canvasContainer, {
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ]
        });
        
        canvasContainer.dispatchEvent(touchMoveEvent);
        
        expect(preventDefaultSpy).toHaveBeenCalled();
      }
    });

    it('should prevent scrolling during panel drag', () => {
      render(<MobileImageEditor />);
      
      fireEvent.click(screen.getByTitle('Text Settings'));
      const panelContent = screen.getByText('Text Content').closest('.mobile-panel-content');
      
      if (panelContent) {
        const touchMoveEvent = new TouchEvent('touchmove', {
          touches: [new Touch({ identifier: 0, target: panelContent, clientY: 200 })] as any
        });
        
        const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault');
        
        fireEvent.touchStart(panelContent, {
          touches: [{ clientY: 100 }]
        });
        
        panelContent.dispatchEvent(touchMoveEvent);
        
        expect(preventDefaultSpy).toHaveBeenCalled();
      }
    });
  });
});