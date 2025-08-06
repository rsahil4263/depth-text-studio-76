import * as React from "react"

// Mobile breakpoint definitions
const BREAKPOINTS = {
  MOBILE_SM: 480,    // Small mobile devices
  MOBILE_MD: 768,    // Medium mobile devices / tablets
  TABLET: 1024,      // Tablets in landscape
  DESKTOP: 1280      // Desktop
} as const

// Device type definitions
export type DeviceType = 'mobile-sm' | 'mobile-md' | 'tablet' | 'desktop'
export type Orientation = 'portrait' | 'landscape'

export interface MobileDetection {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  deviceType: DeviceType
  orientation: Orientation
  screenWidth: number
  screenHeight: number
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE_MD - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE_MD)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE_MD)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useMobileDetection(): MobileDetection {
  const [detection, setDetection] = React.useState<MobileDetection>(() => {
    // Initialize with default values for SSR compatibility
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
        orientation: 'landscape',
        screenWidth: 1920,
        screenHeight: 1080
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight
    
    return {
      isMobile: width < BREAKPOINTS.MOBILE_MD,
      isTablet: width >= BREAKPOINTS.MOBILE_MD && width < BREAKPOINTS.DESKTOP,
      isDesktop: width >= BREAKPOINTS.DESKTOP,
      deviceType: getDeviceType(width),
      orientation: width > height ? 'landscape' : 'portrait',
      screenWidth: width,
      screenHeight: height
    }
  })

  React.useEffect(() => {
    const updateDetection = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setDetection({
        isMobile: width < BREAKPOINTS.MOBILE_MD,
        isTablet: width >= BREAKPOINTS.MOBILE_MD && width < BREAKPOINTS.DESKTOP,
        isDesktop: width >= BREAKPOINTS.DESKTOP,
        deviceType: getDeviceType(width),
        orientation: width > height ? 'landscape' : 'portrait',
        screenWidth: width,
        screenHeight: height
      })
    }

    // Create media query listeners for different breakpoints
    const mobileSmQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE_SM - 1}px)`)
    const mobileMdQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE_MD - 1}px)`)
    const tabletQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.TABLET - 1}px)`)
    const orientationQuery = window.matchMedia('(orientation: portrait)')

    // Add listeners
    mobileSmQuery.addEventListener('change', updateDetection)
    mobileMdQuery.addEventListener('change', updateDetection)
    tabletQuery.addEventListener('change', updateDetection)
    orientationQuery.addEventListener('change', updateDetection)
    window.addEventListener('resize', updateDetection)

    // Initial detection
    updateDetection()

    // Cleanup
    return () => {
      mobileSmQuery.removeEventListener('change', updateDetection)
      mobileMdQuery.removeEventListener('change', updateDetection)
      tabletQuery.removeEventListener('change', updateDetection)
      orientationQuery.removeEventListener('change', updateDetection)
      window.removeEventListener('resize', updateDetection)
    }
  }, [])

  return detection
}

function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.MOBILE_SM) return 'mobile-sm'
  if (width < BREAKPOINTS.MOBILE_MD) return 'mobile-md'
  if (width < BREAKPOINTS.DESKTOP) return 'tablet'
  return 'desktop'
}

// Hook for responsive breakpoint detection
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<DeviceType>(() => {
    if (typeof window === 'undefined') return 'desktop'
    return getDeviceType(window.innerWidth)
  })

  React.useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(getDeviceType(window.innerWidth))
    }

    window.addEventListener('resize', updateBreakpoint)
    updateBreakpoint()

    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}

// Hook for orientation detection
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = React.useState<Orientation>(() => {
    if (typeof window === 'undefined') return 'landscape'
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  })

  React.useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }

    const orientationQuery = window.matchMedia('(orientation: portrait)')
    orientationQuery.addEventListener('change', updateOrientation)
    window.addEventListener('resize', updateOrientation)
    
    updateOrientation()

    return () => {
      orientationQuery.removeEventListener('change', updateOrientation)
      window.removeEventListener('resize', updateOrientation)
    }
  }, [])

  return orientation
}
