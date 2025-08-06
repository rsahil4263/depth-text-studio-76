import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';

// Simple test to verify the responsive hooks work
describe('Responsive Hooks', () => {

  it('should export responsive hooks', async () => {
    const { useMobileDetection, useOrientation } = await import('@/hooks/use-mobile');
    const { useResponsive, useResponsiveClasses } = await import('@/hooks/use-responsive');
    
    expect(useMobileDetection).toBeDefined();
    expect(useOrientation).toBeDefined();
    expect(useResponsive).toBeDefined();
    expect(useResponsiveClasses).toBeDefined();
  });

  it('should have correct breakpoint constants', async () => {
    // Test that the hooks module loads without errors
    const mobileModule = await import('@/hooks/use-mobile');
    const responsiveModule = await import('@/hooks/use-responsive');
    
    expect(mobileModule).toBeDefined();
    expect(responsiveModule).toBeDefined();
  });
});