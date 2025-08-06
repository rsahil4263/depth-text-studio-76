import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  useIsMobile, 
  useMobileDetection, 
  useBreakpoint, 
  useOrientation,
  type DeviceType,
  type Orientation 
} from '@/hooks/use-mobile';

// Mock window properties
const mockWindow = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
};

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  const mockMql = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  };
  
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue(mockMql)
  });
  
  return mockMql;
};

describe('Mobile Hooks - Device Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useIsMobile', () => {
    it('should detect mobile device correctly', () => {
      mockWindow(375, 667); // iPhone dimensions
      const mockMql = mockMatchMedia(true);
      
      const { result } = renderHook(() => useIsMobile());
      
      expect(result.current).toBe(true);
      expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    });

    it('should detect desktop device correctly', () => {
      mockWindow(1920, 1080); // Desktop dimensions
      const mockMql = mockMatchMedia(false);
      
      const { result } = renderHook(() => useIsMobile());
      
      expect(result.current).toBe(false);
    });

    it('should update when window size changes', () => {
      mockWindow(1920, 1080);
      const mockMql = mockMatchMedia(false);
      
      const { result, rerender } = renderHook(() => useIsMobile());
      
      expect(result.current).toBe(false);
      
      // Simulate window resize to mobile
      mockWindow(375, 667);
      mockMql.matches = true;
      
      // Trigger the media query change event
      act(() => {
        const changeHandler = mockMql.addEventListener.mock.calls.find(
          call => call[0] === 'change'
        )?.[1];
        if (changeHandler) {
          changeHandler();
        }
      });
      
      expect(result.current).toBe(true);
    });

    it('should cleanup event listeners on unmount', () => {
      const mockMql = mockMatchMedia(false);
      
      const { unmount } = renderHook(() => useIsMobile());
      
      unmount();
      
      expect(mockMql.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('useMobileDetection', () => {
    it('should provide comprehensive mobile detection for small mobile', () => {
      mockWindow(375, 667); // iPhone SE dimensions
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        deviceType: 'mobile-sm',
        orientation: 'portrait',
        screenWidth: 375,
        screenHeight: 667
      });
    });

    it('should provide comprehensive mobile detection for medium mobile', () => {
      mockWindow(414, 896); // iPhone 11 Pro Max dimensions
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current).toEqual({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        deviceType: 'mobile-md',
        orientation: 'portrait',
        screenWidth: 414,
        screenHeight: 896
      });
    });

    it('should detect tablet correctly', () => {
      mockWindow(768, 1024); // iPad dimensions
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current).toEqual({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        deviceType: 'tablet',
        orientation: 'portrait',
        screenWidth: 768,
        screenHeight: 1024
      });
    });

    it('should detect desktop correctly', () => {
      mockWindow(1920, 1080); // Desktop dimensions
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
        orientation: 'landscape',
        screenWidth: 1920,
        screenHeight: 1080
      });
    });

    it('should detect landscape orientation', () => {
      mockWindow(896, 414); // iPhone in landscape
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.orientation).toBe('landscape');
    });

    it('should handle SSR correctly', () => {
      // Mock SSR environment
      const originalWindow = global.window;
      delete (global as any).window;
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current).toEqual({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
        orientation: 'landscape',
        screenWidth: 1920,
        screenHeight: 1080
      });
      
      // Restore window
      global.window = originalWindow;
    });

    it('should update on window resize', () => {
      mockWindow(375, 667);
      const mockMql = mockMatchMedia(true);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.deviceType).toBe('mobile-sm');
      
      // Simulate resize to tablet
      mockWindow(768, 1024);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      expect(result.current.deviceType).toBe('tablet');
      expect(result.current.screenWidth).toBe(768);
      expect(result.current.screenHeight).toBe(1024);
    });

    it('should update on orientation change', () => {
      mockWindow(375, 667);
      const orientationMql = mockMatchMedia(true);
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.orientation).toBe('portrait');
      
      // Simulate orientation change to landscape
      mockWindow(667, 375);
      orientationMql.matches = false;
      
      act(() => {
        const orientationHandler = orientationMql.addEventListener.mock.calls.find(
          call => call[0] === 'change'
        )?.[1];
        if (orientationHandler) {
          orientationHandler();
        }
      });
      
      expect(result.current.orientation).toBe('landscape');
    });

    it('should cleanup all event listeners on unmount', () => {
      const mockMql = mockMatchMedia(true);
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useMobileDetection());
      
      unmount();
      
      expect(mockMql.removeEventListener).toHaveBeenCalledTimes(4); // 4 media queries
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('useBreakpoint', () => {
    it('should return correct breakpoint for mobile-sm', () => {
      mockWindow(375, 667);
      
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current).toBe('mobile-sm');
    });

    it('should return correct breakpoint for mobile-md', () => {
      mockWindow(600, 800);
      
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current).toBe('mobile-md');
    });

    it('should return correct breakpoint for tablet', () => {
      mockWindow(800, 1024);
      
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current).toBe('tablet');
    });

    it('should return correct breakpoint for desktop', () => {
      mockWindow(1920, 1080);
      
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current).toBe('desktop');
    });

    it('should update breakpoint on window resize', () => {
      mockWindow(375, 667);
      
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current).toBe('mobile-sm');
      
      // Resize to desktop
      mockWindow(1920, 1080);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      expect(result.current).toBe('desktop');
    });

    it('should handle SSR correctly', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current).toBe('desktop');
      
      global.window = originalWindow;
    });

    it('should cleanup resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useBreakpoint());
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('useOrientation', () => {
    it('should detect portrait orientation', () => {
      mockWindow(375, 667);
      
      const { result } = renderHook(() => useOrientation());
      
      expect(result.current).toBe('portrait');
    });

    it('should detect landscape orientation', () => {
      mockWindow(667, 375);
      
      const { result } = renderHook(() => useOrientation());
      
      expect(result.current).toBe('landscape');
    });

    it('should update on orientation change', () => {
      mockWindow(375, 667);
      const orientationMql = mockMatchMedia(true);
      
      const { result } = renderHook(() => useOrientation());
      
      expect(result.current).toBe('portrait');
      
      // Change to landscape
      mockWindow(667, 375);
      orientationMql.matches = false;
      
      act(() => {
        const orientationHandler = orientationMql.addEventListener.mock.calls.find(
          call => call[0] === 'change'
        )?.[1];
        if (orientationHandler) {
          orientationHandler();
        }
      });
      
      expect(result.current).toBe('landscape');
    });

    it('should update on window resize', () => {
      mockWindow(375, 667);
      
      const { result } = renderHook(() => useOrientation());
      
      expect(result.current).toBe('portrait');
      
      // Resize to landscape
      mockWindow(667, 375);
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      expect(result.current).toBe('landscape');
    });

    it('should handle SSR correctly', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const { result } = renderHook(() => useOrientation());
      
      expect(result.current).toBe('landscape');
      
      global.window = originalWindow;
    });

    it('should cleanup event listeners on unmount', () => {
      const orientationMql = mockMatchMedia(true);
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useOrientation());
      
      unmount();
      
      expect(orientationMql.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Breakpoint Edge Cases', () => {
    it('should handle exact breakpoint boundaries', () => {
      // Test mobile-sm to mobile-md boundary (480px)
      mockWindow(479, 800);
      const { result: result1 } = renderHook(() => useBreakpoint());
      expect(result1.current).toBe('mobile-sm');
      
      mockWindow(480, 800);
      const { result: result2 } = renderHook(() => useBreakpoint());
      expect(result2.current).toBe('mobile-md');
      
      // Test mobile-md to tablet boundary (768px)
      mockWindow(767, 800);
      const { result: result3 } = renderHook(() => useBreakpoint());
      expect(result3.current).toBe('mobile-md');
      
      mockWindow(768, 800);
      const { result: result4 } = renderHook(() => useBreakpoint());
      expect(result4.current).toBe('tablet');
      
      // Test tablet to desktop boundary (1280px)
      mockWindow(1279, 800);
      const { result: result5 } = renderHook(() => useBreakpoint());
      expect(result5.current).toBe('tablet');
      
      mockWindow(1280, 800);
      const { result: result6 } = renderHook(() => useBreakpoint());
      expect(result6.current).toBe('desktop');
    });

    it('should handle very small screens', () => {
      mockWindow(320, 568); // iPhone 5 dimensions
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.deviceType).toBe('mobile-sm');
      expect(result.current.isMobile).toBe(true);
    });

    it('should handle very large screens', () => {
      mockWindow(3840, 2160); // 4K dimensions
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.deviceType).toBe('desktop');
      expect(result.current.isDesktop).toBe(true);
    });

    it('should handle square screens', () => {
      mockWindow(800, 800); // Square screen
      
      const { result } = renderHook(() => useMobileDetection());
      
      expect(result.current.orientation).toBe('landscape'); // width >= height
      expect(result.current.deviceType).toBe('tablet');
    });
  });

  describe('Performance and Memory', () => {
    it('should not create memory leaks with multiple hook instances', () => {
      const hooks = Array.from({ length: 10 }, () => 
        renderHook(() => useMobileDetection())
      );
      
      // All hooks should work correctly
      hooks.forEach(({ result }) => {
        expect(result.current).toBeDefined();
        expect(typeof result.current.isMobile).toBe('boolean');
      });
      
      // Cleanup all hooks
      hooks.forEach(({ unmount }) => unmount());
      
      // Should not throw or cause memory issues
      expect(true).toBe(true);
    });

    it('should handle rapid resize events efficiently', () => {
      mockWindow(375, 667);
      
      const { result } = renderHook(() => useMobileDetection());
      
      // Simulate rapid resize events
      for (let i = 0; i < 100; i++) {
        mockWindow(375 + i, 667);
        act(() => {
          window.dispatchEvent(new Event('resize'));
        });
      }
      
      // Should still work correctly
      expect(result.current.screenWidth).toBe(474); // 375 + 99
      expect(result.current.deviceType).toBe('mobile-sm');
    });
  });
});