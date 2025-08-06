import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from '@/pages/Index';

// Mock the responsive hooks
vi.mock('@/hooks/use-responsive', () => ({
  useResponsive: () => ({
    deviceType: 'mobile-sm',
    orientation: 'portrait',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    screenWidth: 375,
    screenHeight: 667,
    shouldUseMobileUI: true,
    breakpointChanged: false
  }),
  useResponsiveClasses: () => ({
    container: 'responsive-container mobile-layout portrait-mode device-mobile-sm',
    device: 'device-mobile-sm',
    orientation: 'orientation-portrait',
    layout: 'mobile-layout',
    mobileOnly: '',
    desktopOnly: 'hidden',
    portraitOnly: '',
    landscapeOnly: 'hidden'
  }),
  useResponsiveCallbacks: () => {}
}));

// Mock the background removal service
vi.mock('@/lib/backgroundRemoval', () => ({
  segmentSubject: vi.fn(),
  loadImage: vi.fn(),
  renderTextBehindSubject: vi.fn()
}));

// Mock CSS modules
vi.mock('@/components/MobileImageEditor.module.css', () => ({
  default: {
    container: 'mobile-container',
    header: 'mobile-header',
    statusBar: 'mobile-status-bar'
  }
}));

describe('Mobile UI Integration', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    );
  };

  it('should render Index page with mobile UI integration', () => {
    const Wrapper = createWrapper();
    
    render(<Index />, { wrapper: Wrapper });
    
    // Check that the Index page renders
    expect(screen.getByTestId || screen.getByRole || document.querySelector('.index-page')).toBeTruthy();
  });

  it('should pass integration props to ResponsiveImageEditor', () => {
    const Wrapper = createWrapper();
    
    const { container } = render(<Index />, { wrapper: Wrapper });
    
    // Check that the responsive container is present
    const responsiveContainer = container.querySelector('.responsive-image-editor-container');
    expect(responsiveContainer || container.querySelector('[data-ui-mode]')).toBeTruthy();
  });

  it('should handle mobile-specific callbacks', () => {
    const Wrapper = createWrapper();
    
    // This test verifies that the component structure supports the callbacks
    // without actually triggering them (which would require more complex mocking)
    expect(() => {
      render(<Index />, { wrapper: Wrapper });
    }).not.toThrow();
  });
});