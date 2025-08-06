import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HtmlImageEditor } from '../HtmlImageEditor';

// Mock browser compatibility and error handling services
vi.mock('@/lib/browserCompatibility', () => ({
  detectBrowser: vi.fn(() => ({
    name: 'Chrome',
    version: '120',
    engine: 'Blink',
    isSupported: true,
    features: {
      webAssembly: true,
      canvas2d: true,
      fileApi: true,
      urlApi: true,
      performanceApi: true,
      corsHeaders: true,
      imageFormats: {
        png: true,
        jpeg: true,
        webp: true
      }
    },
    warnings: []
  })),
  validateBrowserCompatibility: vi.fn(),
  getBrowserPerformanceProfile: vi.fn(() => ({
    expectedProcessingTime: 2000,
    maxImageSize: 15 * 1024 * 1024,
    memoryLimit: 1024 * 1024 * 1024,
    optimizationLevel: 'high' as const
  })),
  runCompatibilityTest: vi.fn(() => Promise.resolve({
    passed: true,
    results: {
      browserInfo: {
        name: 'Chrome',
        version: '120',
        engine: 'Blink',
        isSupported: true,
        features: {
          webAssembly: true,
          canvas2d: true,
          fileApi: true,
          urlApi: true,
          performanceApi: true,
          corsHeaders: true,
          imageFormats: { png: true, jpeg: true, webp: true }
        },
        warnings: []
      },
      performanceProfile: {
        expectedProcessingTime: 2000,
        maxImageSize: 15 * 1024 * 1024,
        memoryLimit: 1024 * 1024 * 1024,
        optimizationLevel: 'high' as const
      },
      corsSupport: true,
      testResults: {
        webAssembly: true,
        canvas: true,
        fileHandling: true,
        imageProcessing: true
      }
    },
    recommendations: []
  })),
  logBrowserCompatibility: vi.fn()
}));

vi.mock('@/lib/errorHandling', () => ({
  handleBackgroundRemovalError: vi.fn((error) => ({
    ...error,
    type: 'UNKNOWN_ERROR',
    userMessage: error.message,
    retryable: true
  })),
  withErrorHandling: vi.fn((fn) => fn()),
  ErrorRecoveryStrategies: {
    MEMORY_ERROR: {
      suggestions: ['Try a smaller image', 'Close other browser tabs'],
      autoRetry: false
    },
    NETWORK_ERROR: {
      suggestions: ['Check your internet connection', 'Try again in a few moments'],
      autoRetry: true,
      retryDelay: 2000
    },
    UNKNOWN_ERROR: {
      suggestions: ['Please try again'],
      autoRetry: false
    }
  },
  BackgroundRemovalErrorType: {
    MEMORY_ERROR: 'MEMORY_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  }
}));

// Mock CSS modules
vi.mock('../HtmlImageEditor.module.css', () => ({
  default: {
    container: 'container',
    sidebar: 'sidebar',
    sidebarHeader: 'sidebarHeader',
    logo: 'logo',
    subtitle: 'subtitle',
    section: 'section',
    sectionTitle: 'sectionTitle',
    inputGroup: 'inputGroup',
    label: 'label',
    textInput: 'textInput',
    select: 'select',
    slider: 'slider',
    toggleGroup: 'toggleGroup',
    toggleButton: 'toggleButton',
    active: 'active',
    colorPicker: 'colorPicker',
    exportSection: 'exportSection',
    exportButton: 'exportButton',
    uploadButton: 'uploadButton',
    mainContent: 'mainContent',
    statusBar: 'statusBar',
    statusIndicator: 'statusIndicator',
    statusDot: 'statusDot',
    progressContainer: 'progressContainer',
    progressBar: 'progressBar',
    progressFill: 'progressFill',
    progressText: 'progressText',
    processing: 'processing',
    error: 'error',
    viewport: 'viewport',
    uploadArea: 'uploadArea',
    dragOver: 'dragOver',
    fadeIn: 'fadeIn',
    uploadIcon: 'uploadIcon',
    uploadTitle: 'uploadTitle',
    uploadSubtitle: 'uploadSubtitle',
    uploadFormats: 'uploadFormats',
    canvasContainer: 'canvasContainer',
    canvas: 'canvas',
    textOverlay: 'textOverlay',
    controlsBar: 'controlsBar',
    zoomControls: 'zoomControls',
    zoomButton: 'zoomButton',
    zoomLevel: 'zoomLevel',
    actionButtons: 'actionButtons',
    actionButton: 'actionButton',
    secondary: 'secondary',
    hiddenInput: 'hiddenInput'
  }
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Image constructor
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  naturalWidth = 800;
  naturalHeight = 600;
  
  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
} as any;

describe('HtmlImageEditor State Management', () => {
  it('should render with default state values', () => {
    render(<HtmlImageEditor />);
    
    // Check default text content
    const textInput = screen.getByDisplayValue('Your text here');
    expect(textInput).toBeInTheDocument();
    
    // Check default font size
    const fontSizeLabel = screen.getByText(/Font Size: 48px/);
    expect(fontSizeLabel).toBeInTheDocument();
    
    // Check default zoom level
    const zoomLevel = screen.getByText('100%');
    expect(zoomLevel).toBeInTheDocument();
    
    // Check default status message
    const statusMessage = screen.getByText('Ready');
    expect(statusMessage).toBeInTheDocument();
  });

  it('should update text content when input changes', () => {
    render(<HtmlImageEditor />);
    
    const textInput = screen.getByDisplayValue('Your text here');
    fireEvent.change(textInput, { target: { value: 'New text content' } });
    
    expect(textInput).toHaveValue('New text content');
  });

  it('should update font size when slider changes', () => {
    render(<HtmlImageEditor />);
    
    const fontSizeSlider = screen.getByDisplayValue('48');
    fireEvent.change(fontSizeSlider, { target: { value: '72' } });
    
    const fontSizeLabel = screen.getByText(/Font Size: 72px/);
    expect(fontSizeLabel).toBeInTheDocument();
  });

  it('should toggle text style buttons', () => {
    render(<HtmlImageEditor />);
    
    const boldButton = screen.getByText('B');
    const italicButton = screen.getByText('I');
    const underlineButton = screen.getByText('U');
    
    // Initially not active
    expect(boldButton).not.toHaveClass('active');
    expect(italicButton).not.toHaveClass('active');
    expect(underlineButton).not.toHaveClass('active');
    
    // Click to activate
    fireEvent.click(boldButton);
    fireEvent.click(italicButton);
    fireEvent.click(underlineButton);
    
    expect(boldButton).toHaveClass('active');
    expect(italicButton).toHaveClass('active');
    expect(underlineButton).toHaveClass('active');
  });

  it('should update zoom level with zoom controls', () => {
    render(<HtmlImageEditor />);
    
    const zoomInButton = screen.getByText('+');
    const zoomOutButton = screen.getByText('−');
    const resetButton = screen.getByText('⌂');
    
    // Test zoom in
    fireEvent.click(zoomInButton);
    expect(screen.getByText('110%')).toBeInTheDocument();
    
    // Test zoom out
    fireEvent.click(zoomOutButton);
    fireEvent.click(zoomOutButton);
    expect(screen.getByText('90%')).toBeInTheDocument();
    
    // Test reset
    fireEvent.click(resetButton);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should reset text settings when reset button is clicked', () => {
    render(<HtmlImageEditor />);
    
    // Change some settings first
    const textInput = screen.getByDisplayValue('Your text here');
    const fontSizeSlider = screen.getByDisplayValue('48');
    const boldButton = screen.getByText('B');
    
    fireEvent.change(textInput, { target: { value: 'Modified text' } });
    fireEvent.change(fontSizeSlider, { target: { value: '72' } });
    fireEvent.click(boldButton);
    
    // Verify changes
    expect(textInput).toHaveValue('Modified text');
    expect(screen.getByText(/Font Size: 72px/)).toBeInTheDocument();
    expect(boldButton).toHaveClass('active');
    
    // Reset
    const resetButton = screen.getByText('Reset Text');
    fireEvent.click(resetButton);
    
    // Verify reset to defaults
    expect(textInput).toHaveValue('Your text here');
    expect(screen.getByText(/Font Size: 48px/)).toBeInTheDocument();
    expect(boldButton).not.toHaveClass('active');
  });

  it('should call onTextChange callback when text changes', () => {
    const onTextChange = vi.fn();
    render(<HtmlImageEditor onTextChange={onTextChange} />);
    
    const textInput = screen.getByDisplayValue('Your text here');
    fireEvent.change(textInput, { target: { value: 'New text' } });
    
    expect(onTextChange).toHaveBeenCalledWith('New text');
  });

  it('should disable zoom buttons at limits', () => {
    render(<HtmlImageEditor />);
    
    const zoomInButton = screen.getByText('+');
    const zoomOutButton = screen.getByText('−');
    
    // Zoom to minimum
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomOutButton);
    }
    expect(zoomOutButton).toBeDisabled();
    expect(screen.getByText('10%')).toBeInTheDocument();
    
    // Reset and zoom to maximum
    const resetButton = screen.getByText('⌂');
    fireEvent.click(resetButton);
    
    for (let i = 0; i < 40; i++) {
      fireEvent.click(zoomInButton);
    }
    expect(zoomInButton).toBeDisabled();
    expect(screen.getByText('500%')).toBeInTheDocument();
  });
});

describe('HtmlImageEditor File Upload and Drag-and-Drop', () => {
  it('should display upload area when no image is loaded', () => {
    render(<HtmlImageEditor />);
    
    expect(screen.getByText('Drop your image here')).toBeInTheDocument();
    expect(screen.getByText('Or click to browse files')).toBeInTheDocument();
    expect(screen.getByText('Supports JPG, PNG, WebP, GIF')).toBeInTheDocument();
  });

  it('should handle valid image file upload', async () => {
    render(<HtmlImageEditor />);
    
    const fileInput = screen.getByRole('button', { name: /upload new image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Should show loading status
    expect(screen.getByText(/Loading test.jpg.../)).toBeInTheDocument();
    
    // Wait for image to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should show success status
    expect(screen.getByText(/Image loaded: 800x600/)).toBeInTheDocument();
  });

  it('should reject invalid file types', () => {
    render(<HtmlImageEditor />);
    
    const fileInput = screen.getByRole('button', { name: /upload new image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(screen.getByText(/Please select a valid image file/)).toBeInTheDocument();
  });

  it('should reject files that are too large', () => {
    render(<HtmlImageEditor />);
    
    const fileInput = screen.getByRole('button', { name: /upload new image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a mock file that's larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    expect(screen.getByText(/File too large/)).toBeInTheDocument();
  });

  it('should handle drag over events with visual feedback', () => {
    render(<HtmlImageEditor />);
    
    const viewport = screen.getByText('Drop your image here').closest('.viewport') as HTMLElement;
    const uploadArea = screen.getByText('Drop your image here').closest('.uploadArea') as HTMLElement;
    
    // Create drag event with files
    const dragEvent = new DragEvent('dragover', {
      bubbles: true,
      dataTransfer: new DataTransfer()
    });
    
    // Mock dataTransfer.types to include 'Files'
    Object.defineProperty(dragEvent.dataTransfer, 'types', {
      value: ['Files'],
      writable: false
    });
    
    fireEvent(viewport, dragEvent);
    
    expect(viewport).toHaveClass('dragOver');
    expect(uploadArea).toHaveClass('dragOver');
  });

  it('should handle file drop with validation', async () => {
    render(<HtmlImageEditor />);
    
    const viewport = screen.getByText('Drop your image here').closest('.viewport') as HTMLElement;
    
    const file = new File(['test'], 'dropped.png', { type: 'image/png' });
    
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      dataTransfer: new DataTransfer()
    });
    
    // Add file to dataTransfer
    Object.defineProperty(dropEvent.dataTransfer, 'files', {
      value: [file],
      writable: false
    });
    
    fireEvent(viewport, dropEvent);
    
    // Should show loading status
    expect(screen.getByText(/Loading dropped.png.../)).toBeInTheDocument();
    
    // Wait for image to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should show success status
    expect(screen.getByText(/Image loaded: 800x600/)).toBeInTheDocument();
  });

  it('should reject multiple files in drop', () => {
    render(<HtmlImageEditor />);
    
    const viewport = screen.getByText('Drop your image here').closest('.viewport') as HTMLElement;
    
    const file1 = new File(['test1'], 'file1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['test2'], 'file2.jpg', { type: 'image/jpeg' });
    
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      dataTransfer: new DataTransfer()
    });
    
    Object.defineProperty(dropEvent.dataTransfer, 'files', {
      value: [file1, file2],
      writable: false
    });
    
    fireEvent(viewport, dropEvent);
    
    expect(screen.getByText(/Please drop only one image file at a time/)).toBeInTheDocument();
  });

  it('should reject invalid file types in drop', () => {
    render(<HtmlImageEditor />);
    
    const viewport = screen.getByText('Drop your image here').closest('.viewport') as HTMLElement;
    
    const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
    
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      dataTransfer: new DataTransfer()
    });
    
    Object.defineProperty(dropEvent.dataTransfer, 'files', {
      value: [file],
      writable: false
    });
    
    fireEvent(viewport, dropEvent);
    
    expect(screen.getByText(/is not a supported image format/)).toBeInTheDocument();
  });

  it('should clear drag over state on drag leave', () => {
    render(<HtmlImageEditor />);
    
    const viewport = screen.getByText('Drop your image here').closest('.viewport') as HTMLElement;
    const uploadArea = screen.getByText('Drop your image here').closest('.uploadArea') as HTMLElement;
    
    // First trigger drag over
    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      dataTransfer: new DataTransfer()
    });
    
    Object.defineProperty(dragOverEvent.dataTransfer, 'types', {
      value: ['Files'],
      writable: false
    });
    
    fireEvent(viewport, dragOverEvent);
    expect(viewport).toHaveClass('dragOver');
    
    // Then trigger drag leave
    const dragLeaveEvent = new DragEvent('dragleave', {
      bubbles: true,
      clientX: -10, // Outside the viewport bounds
      clientY: -10
    });
    
    // Mock getBoundingClientRect
    viewport.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));
    
    fireEvent(viewport, dragLeaveEvent);
    expect(viewport).not.toHaveClass('dragOver');
  });

  it('should call onImageLoad callback when image is loaded', async () => {
    const onImageLoad = vi.fn();
    render(<HtmlImageEditor onImageLoad={onImageLoad} />);
    
    const fileInput = screen.getByRole('button', { name: /upload new image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for image to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(onImageLoad).toHaveBeenCalled();
  });
});

describe('HtmlImageEditor Browser Compatibility Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize browser compatibility on component mount', async () => {
    const { detectBrowser, getBrowserPerformanceProfile, runCompatibilityTest } = await import('@/lib/browserCompatibility');
    
    render(<HtmlImageEditor />);
    
    await waitFor(() => {
      expect(detectBrowser).toHaveBeenCalled();
      expect(getBrowserPerformanceProfile).toHaveBeenCalled();
      expect(runCompatibilityTest).toHaveBeenCalled();
    });
  });

  it('should display browser warnings when present', async () => {
    const { detectBrowser } = await import('@/lib/browserCompatibility');
    
    // Mock browser with warnings
    vi.mocked(detectBrowser).mockReturnValue({
      name: 'Safari',
      version: '13',
      engine: 'WebKit',
      isSupported: true,
      features: {
        webAssembly: true,
        canvas2d: true,
        fileApi: true,
        urlApi: true,
        performanceApi: true,
        corsHeaders: true,
        imageFormats: { png: true, jpeg: true, webp: false }
      },
      warnings: ['Safari versions below 14 may have limited WebAssembly support']
    });

    render(<HtmlImageEditor />);
    
    await waitFor(() => {
      expect(screen.getByText('Browser Info')).toBeInTheDocument();
      expect(screen.getByText('Safari 13')).toBeInTheDocument();
      expect(screen.getByText('Compatibility Warnings')).toBeInTheDocument();
      expect(screen.getByText(/Safari versions below 14/)).toBeInTheDocument();
    });
  });

  it('should display performance level indicator', async () => {
    const { getBrowserPerformanceProfile } = await import('@/lib/browserCompatibility');
    
    // Mock low performance browser
    vi.mocked(getBrowserPerformanceProfile).mockReturnValue({
      expectedProcessingTime: 4000,
      maxImageSize: 6 * 1024 * 1024,
      memoryLimit: 256 * 1024 * 1024,
      optimizationLevel: 'low' as const
    });

    render(<HtmlImageEditor />);
    
    await waitFor(() => {
      expect(screen.getByText('low performance')).toBeInTheDocument();
      expect(screen.getByText(/Consider using Chrome or Edge/)).toBeInTheDocument();
    });
  });

  it('should use browser-specific file size limits', async () => {
    const { getBrowserPerformanceProfile } = await import('@/lib/browserCompatibility');
    
    // Mock browser with smaller file size limit
    vi.mocked(getBrowserPerformanceProfile).mockReturnValue({
      expectedProcessingTime: 4000,
      maxImageSize: 5 * 1024 * 1024, // 5MB limit
      memoryLimit: 256 * 1024 * 1024,
      optimizationLevel: 'low' as const
    });

    render(<HtmlImageEditor />);
    
    const fileInput = screen.getByRole('button', { name: /upload new image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a file larger than the browser-specific limit (6MB > 5MB limit)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Maximum size for.*is 5.0MB/)).toBeInTheDocument();
    });
  });

  it('should handle browser compatibility errors', async () => {
    const { detectBrowser } = await import('@/lib/browserCompatibility');
    const { handleBackgroundRemovalError } = await import('@/lib/errorHandling');
    
    // Mock unsupported browser
    vi.mocked(detectBrowser).mockReturnValue({
      name: 'Internet Explorer',
      version: '11',
      engine: 'Trident',
      isSupported: false,
      features: {
        webAssembly: false,
        canvas2d: true,
        fileApi: false,
        urlApi: false,
        performanceApi: false,
        corsHeaders: false,
        imageFormats: { png: true, jpeg: true, webp: false }
      },
      warnings: ['Browser does not support all required features']
    });

    render(<HtmlImageEditor />);
    
    const fileInput = screen.getByRole('button', { name: /upload new image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Browser compatibility issue/)).toBeInTheDocument();
    });
  });

  it('should show error recovery suggestions', async () => {
    const { withErrorHandling } = await import('@/lib/errorHandling');
    
    // Mock error during processing
    vi.mocked(withErrorHandling).mockRejectedValue(new Error('Memory allocation failed'));

    render(<HtmlImageEditor />);
    
    const fileInput = screen.getByRole('button', { name: /upload new image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Try: Try a smaller image/)).toBeInTheDocument();
    });
  });

  it('should handle export errors with recovery suggestions', async () => {
    const { withErrorHandling } = await import('@/lib/errorHandling');
    
    // First upload an image successfully
    render(<HtmlImageEditor />);
    
    const fileInput = screen.getByRole('button', { name: /upload new image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Image loaded/)).toBeInTheDocument();
    });
    
    // Mock export error
    vi.mocked(withErrorHandling).mockRejectedValueOnce(new Error('Export failed'));
    
    const exportButton = screen.getByRole('button', { name: /download processed image/i });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Try: Please try again/)).toBeInTheDocument();
    });
  });

  it('should log browser compatibility information', async () => {
    const { logBrowserCompatibility } = await import('@/lib/browserCompatibility');
    
    render(<HtmlImageEditor />);
    
    await waitFor(() => {
      expect(logBrowserCompatibility).toHaveBeenCalled();
    });
  });

  it('should show browser performance information in console', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    
    render(<HtmlImageEditor />);
    
    // Wait for initialization and then trigger performance info display
    await waitFor(() => {
      expect(consoleGroupSpy).toHaveBeenCalledWith('🌐 Browser Performance Information');
    });
    
    consoleSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
  });

  it('should handle text rendering errors with structured error handling', async () => {
    const { withErrorHandling } = await import('@/lib/errorHandling');
    
    render(<HtmlImageEditor />);
    
    // First upload an image
    const fileInput = screen.getByRole('button', { name: /upload new image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Image loaded/)).toBeInTheDocument();
    });
    
    // Mock text rendering error
    vi.mocked(withErrorHandling).mockRejectedValueOnce(new Error('Canvas context error'));
    
    // Change text to trigger re-rendering
    const textInput = screen.getByDisplayValue('Your text here');
    fireEvent.change(textInput, { target: { value: 'New text that causes error' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Canvas context error/)).toBeInTheDocument();
    });
  });
});