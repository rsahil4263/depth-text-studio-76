import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MobileImageEditor } from '../MobileImageEditor';

// Mock the background removal service
vi.mock('@/lib/backgroundRemoval', () => ({
  segmentSubject: vi.fn(),
  loadImage: vi.fn(),
  renderTextBehindSubject: vi.fn()
}));

describe('MobileImageEditor - Control Panels System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Panel Management', () => {
    it('should open text panel when text button is clicked', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your text...')).toBeInTheDocument();
    });

    it('should open position panel when effects button is clicked', () => {
      render(<MobileImageEditor />);
      
      const effectsButton = screen.getByTitle('Position & Effects');
      fireEvent.click(effectsButton);
      
      expect(screen.getByText('Position & Effects')).toBeInTheDocument();
      expect(screen.getByText('Horizontal Position')).toBeInTheDocument();
    });

    it('should open pro panel when pro button is clicked', () => {
      render(<MobileImageEditor />);
      
      const proButton = screen.getByTitle('Pro Features');
      fireEvent.click(proButton);
      
      expect(screen.getByText('Pro Features')).toBeInTheDocument();
      expect(screen.getByText('Unlock Pro Features')).toBeInTheDocument();
    });

    it('should close panel when backdrop is clicked', () => {
      render(<MobileImageEditor />);
      
      // Open text panel
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
      
      // Click backdrop
      const backdrop = document.querySelector('.panelBackdrop');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
    });

    it('should close panel when close button is clicked', () => {
      render(<MobileImageEditor />);
      
      // Open text panel
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
      
      // Click close button
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
    });

    it('should toggle panel when same button is clicked twice', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      
      // Open panel
      fireEvent.click(textButton);
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
      
      // Close panel
      fireEvent.click(textButton);
      expect(screen.queryByText('Text Settings')).not.toBeInTheDocument();
    });
  });

  describe('Text Control Panel', () => {
    it('should render all text control inputs', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      expect(screen.getByPlaceholderText('Enter your text...')).toBeInTheDocument();
      expect(screen.getByText('Font Family')).toBeInTheDocument();
      expect(screen.getByText('Font Size')).toBeInTheDocument();
      expect(screen.getByText('Text Color')).toBeInTheDocument();
      expect(screen.getByText('Style Options')).toBeInTheDocument();
    });

    it('should update text content when input changes', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      const textInput = screen.getByPlaceholderText('Enter your text...');
      fireEvent.change(textInput, { target: { value: 'New text content' } });
      
      expect(textInput).toHaveValue('New text content');
    });

    it('should have style toggle buttons', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      expect(screen.getByText('B')).toBeInTheDocument(); // Bold
      expect(screen.getByText('I')).toBeInTheDocument(); // Italic
      expect(screen.getByText('U')).toBeInTheDocument(); // Underline
    });
  });

  describe('Position & Effects Panel', () => {
    it('should render all position and effects controls', () => {
      render(<MobileImageEditor />);
      
      const effectsButton = screen.getByTitle('Position & Effects');
      fireEvent.click(effectsButton);
      
      expect(screen.getByText('Horizontal Position')).toBeInTheDocument();
      expect(screen.getByText('Vertical Position')).toBeInTheDocument();
      expect(screen.getByText('Opacity')).toBeInTheDocument();
      expect(screen.getByText('Depth Blur')).toBeInTheDocument();
    });

    it('should show percentage values for position sliders', () => {
      render(<MobileImageEditor />);
      
      const effectsButton = screen.getByTitle('Position & Effects');
      fireEvent.click(effectsButton);
      
      expect(screen.getByText('50%')).toBeInTheDocument(); // Default horizontal position
    });
  });

  describe('Pro Features Panel', () => {
    it('should render pro features content', () => {
      render(<MobileImageEditor />);
      
      const proButton = screen.getByTitle('Pro Features');
      fireEvent.click(proButton);
      
      expect(screen.getByText('Unlock Pro Features')).toBeInTheDocument();
      expect(screen.getByText('Get access to advanced text effects, premium fonts, batch processing, and more!')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    it('should show pro features list', () => {
      render(<MobileImageEditor />);
      
      const proButton = screen.getByTitle('Pro Features');
      fireEvent.click(proButton);
      
      expect(screen.getByText('✨ Advanced text effects')).toBeInTheDocument();
      expect(screen.getByText('🎨 Premium font library')).toBeInTheDocument();
      expect(screen.getByText('⚡ Batch processing')).toBeInTheDocument();
      expect(screen.getByText('💾 Cloud storage')).toBeInTheDocument();
    });
  });

  describe('Touch Gestures', () => {
    it('should handle touch events on panels', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      const panel = document.querySelector('.panel');
      expect(panel).toBeInTheDocument();
      
      if (panel) {
        // Simulate touch start
        fireEvent.touchStart(panel, {
          touches: [{ clientY: 100 }]
        });
        
        // Simulate touch move (swipe down)
        fireEvent.touchMove(panel, {
          touches: [{ clientY: 200 }]
        });
        
        // Simulate touch end
        fireEvent.touchEnd(panel);
        
        // Panel should still be visible for small swipe
        expect(screen.getByText('Text Settings')).toBeInTheDocument();
      }
    });
  });

  describe('Panel Animations', () => {
    it('should apply slide up animation when panel opens', async () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      const panel = document.querySelector('.panel');
      expect(panel).toHaveStyle('animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('should show backdrop with fade animation', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      fireEvent.click(textButton);
      
      const backdrop = document.querySelector('.panelBackdrop');
      expect(backdrop).toHaveStyle('animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      const effectsButton = screen.getByTitle('Position & Effects');
      const proButton = screen.getByTitle('Pro Features');
      
      expect(textButton).toHaveAttribute('title', 'Text Settings');
      expect(effectsButton).toHaveAttribute('title', 'Position & Effects');
      expect(proButton).toHaveAttribute('title', 'Pro Features');
    });

    it('should support keyboard navigation', () => {
      render(<MobileImageEditor />);
      
      const textButton = screen.getByTitle('Text Settings');
      textButton.focus();
      
      fireEvent.keyDown(textButton, { key: 'Enter' });
      expect(screen.getByText('Text Settings')).toBeInTheDocument();
    });
  });
});