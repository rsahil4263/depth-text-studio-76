import { useEffect, useState } from "react";
import { useMobileDetection, useOrientation, type DeviceType, type Orientation } from "./use-mobile";

export interface ResponsiveState {
  deviceType: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  shouldUseMobileUI: boolean;
  breakpointChanged: boolean;
}

/**
 * Hook for comprehensive responsive state management
 * Provides device detection, orientation tracking, and UI mode determination
 */
export function useResponsive(): ResponsiveState {
  const detection = useMobileDetection();
  const orientation = useOrientation();
  const [breakpointChanged, setBreakpointChanged] = useState(false);
  const [previousDeviceType, setPreviousDeviceType] = useState<DeviceType>(detection.deviceType);

  // Track breakpoint changes
  useEffect(() => {
    if (previousDeviceType !== detection.deviceType) {
      setBreakpointChanged(true);
      setPreviousDeviceType(detection.deviceType);
      
      // Reset the flag after a short delay
      const timer = setTimeout(() => {
        setBreakpointChanged(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [detection.deviceType, previousDeviceType]);

  // Determine if mobile UI should be used
  const shouldUseMobileUI = (): boolean => {
    // Check for touch devices and mobile user agents
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Always use mobile UI for small and medium mobile screens
    if (detection.deviceType === 'mobile-sm' || detection.deviceType === 'mobile-md') {
      return true;
    }

    // For tablets, use mobile UI in portrait or if screen is narrow
    if (detection.deviceType === 'tablet') {
      return orientation === 'portrait' || detection.screenWidth < 900 || isTouchDevice;
    }

    // Use mobile UI if it's a touch device or mobile user agent, even on larger screens
    if (isTouchDevice || isMobileUserAgent) {
      return detection.screenWidth < 1024;
    }

    // For desktop, always use desktop UI
    return false;
  };

  return {
    deviceType: detection.deviceType,
    orientation,
    isMobile: detection.isMobile,
    isTablet: detection.isTablet,
    isDesktop: detection.isDesktop,
    screenWidth: detection.screenWidth,
    screenHeight: detection.screenHeight,
    shouldUseMobileUI: shouldUseMobileUI(),
    breakpointChanged
  };
}

/**
 * Hook for responsive CSS classes
 * Returns classes that can be applied to components for responsive styling
 */
export function useResponsiveClasses() {
  const responsive = useResponsive();

  return {
    container: `
      responsive-container
      ${responsive.shouldUseMobileUI ? 'mobile-layout' : 'desktop-layout'}
      ${responsive.orientation === 'portrait' ? 'portrait-mode' : 'landscape-mode'}
      device-${responsive.deviceType}
    `.trim().replace(/\s+/g, ' '),
    
    device: `device-${responsive.deviceType}`,
    orientation: `orientation-${responsive.orientation}`,
    layout: responsive.shouldUseMobileUI ? 'mobile-layout' : 'desktop-layout',
    
    // Utility classes for conditional styling
    mobileOnly: responsive.shouldUseMobileUI ? '' : 'hidden',
    desktopOnly: responsive.shouldUseMobileUI ? 'hidden' : '',
    portraitOnly: responsive.orientation === 'portrait' ? '' : 'hidden',
    landscapeOnly: responsive.orientation === 'landscape' ? '' : 'hidden'
  };
}

/**
 * Hook for responsive breakpoint matching
 * Similar to CSS media queries but for JavaScript
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Predefined media query hooks for common breakpoints
 */
export function useIsMobileSmall() {
  return useMediaQuery('(max-width: 479px)');
}

export function useIsMobileMedium() {
  return useMediaQuery('(min-width: 480px) and (max-width: 767px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1279px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1280px)');
}

export function useIsPortrait() {
  return useMediaQuery('(orientation: portrait)');
}

export function useIsLandscape() {
  return useMediaQuery('(orientation: landscape)');
}

/**
 * Hook for handling responsive layout changes
 * Provides callbacks for when breakpoints or orientation changes
 */
export function useResponsiveCallbacks(callbacks: {
  onBreakpointChange?: (deviceType: DeviceType) => void;
  onOrientationChange?: (orientation: Orientation) => void;
  onMobileUIToggle?: (useMobileUI: boolean) => void;
}) {
  const responsive = useResponsive();
  const [previousOrientation, setPreviousOrientation] = useState(responsive.orientation);
  const [previousMobileUI, setPreviousMobileUI] = useState(responsive.shouldUseMobileUI);

  useEffect(() => {
    if (responsive.breakpointChanged && callbacks.onBreakpointChange) {
      callbacks.onBreakpointChange(responsive.deviceType);
    }
  }, [responsive.breakpointChanged, responsive.deviceType, callbacks]);

  useEffect(() => {
    if (previousOrientation !== responsive.orientation && callbacks.onOrientationChange) {
      callbacks.onOrientationChange(responsive.orientation);
      setPreviousOrientation(responsive.orientation);
    }
  }, [responsive.orientation, previousOrientation, callbacks]);

  useEffect(() => {
    if (previousMobileUI !== responsive.shouldUseMobileUI && callbacks.onMobileUIToggle) {
      callbacks.onMobileUIToggle(responsive.shouldUseMobileUI);
      setPreviousMobileUI(responsive.shouldUseMobileUI);
    }
  }, [responsive.shouldUseMobileUI, previousMobileUI, callbacks]);
}