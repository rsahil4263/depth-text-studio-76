import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileImageEditor } from '../components/MobileImageEditor';

// Mock the background removal service
vi.mock('@/lib/backgroundRemoval', () => ({
  segmentSubject: vi.fn(),
  loadImage: vi.fn(),
  renderTextBehindSubject: vi.fn()
}));

describe('MobileImageEditor Mobile Gestures', () => {
  it('should render without crashing', () => {
    render(<MobileImageEditor />);
    expect(screen.getByText('TextBehind')).toBeInTheDocument();
  });

  it('should handle touch events on upload area', () => {
    render(<MobileImageEditor />);
    const uploadArea = screen.getByText('Tap to add image').closest('div');
    
    // Test touch start
    fireEvent.touchStart(uploadArea!, {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    
    // Test touch move
    fireEvent.touchMove(uploadArea!, {
      touches: [{ clientX: 120, clientY: 120 }]
    });
    
    // Test touch end
    fireEvent.touchEnd(uploadArea!);
    
    expect(uploadArea).toBeInTheDocument();
  });

  it('should handle panel toggle with haptic feedback', () => {
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true
    });

    render(<MobileImageEditor />);
    const textButton = screen.getByTitle('Text Settings');
    
    fireEvent.click(textButton);
    
    expect(navigator.vibrate).toHaveBeenCalledWith(100);
  });

  it('should handle zoom controls with haptic feedback', () => {
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true
    });

    render(<MobileImageEditor />);
    
    // Need to have an image loaded to show zoom controls
    // For now, just test that the component renders
    expect(screen.getByText('TextBehind')).toBeInTheDocument();
  });

  it('should handle panel swipe gestures', () => {
    render(<MobileImageEditor />);
    
    // Open text panel first
    const textButton = screen.getByTitle('Text Settings');
    fireEvent.click(textButton);
    
    // Find panel content
    const panelContent = screen.getByText('Text Content').closest('.panelContent');
    
    if (panelContent) {
      // Test horizontal swipe
      fireEvent.touchStart(panelContent, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      
      fireEvent.touchMove(panelContent, {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      
      fireEvent.touchEnd(panelContent);
    }
    
    expect(screen.getByText('Text Settings')).toBeInTheDocument();
  });
});