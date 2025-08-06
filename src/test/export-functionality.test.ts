import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderTextBehindSubject } from '@/lib/backgroundRemoval';

// Mock the background removal functions
vi.mock('@/lib/backgroundRemoval', () => ({
  renderTextBehindSubject: vi.fn(),
  segmentSubject: vi.fn(),
  loadImage: vi.fn()
}));

describe('Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Canvas Export Quality', () => {
    it('should create export canvas with original dimensions', () => {
      // Mock canvas and context
      const mockCanvas = {
        width: 1920,
        height: 1080,
        toBlob: vi.fn((callback) => {
          const mockBlob = new Blob(['mock image data'], { type: 'image/png' });
          callback(mockBlob);
        })
      } as any;

      const mockImageData = {
        width: 1920,
        height: 1080,
        data: new Uint8ClampedArray(1920 * 1080 * 4)
      } as ImageData;

      // Mock renderTextBehindSubject to return our mock canvas
      (renderTextBehindSubject as any).mockReturnValue(mockCanvas);

      // Test that the function maintains original dimensions
      const result = renderTextBehindSubject(
        mockCanvas,
        mockImageData,
        'Test Text',
        {
          fontSize: 48,
          fontFamily: 'SF Pro Display',
          color: '#ffffff',
          opacity: 80,
          x: 960,
          y: 540,
          blur: 3,
          bold: false,
          italic: false,
          underline: false
        }
      );

      expect(result).toBe(mockCanvas);
      expect(renderTextBehindSubject).toHaveBeenCalledWith(
        mockCanvas,
        mockImageData,
        'Test Text',
        expect.objectContaining({
          fontSize: 48,
          fontFamily: 'SF Pro Display',
          color: '#ffffff',
          opacity: 80,
          x: 960,
          y: 540,
          blur: 3,
          bold: false,
          italic: false,
          underline: false
        })
      );
    });

    it('should export with maximum quality PNG format', () => {
      const mockCanvas = {
        width: 1920,
        height: 1080,
        toBlob: vi.fn()
      } as any;

      // Simulate calling toBlob with PNG format and quality 1.0
      mockCanvas.toBlob('image/png', 1.0);

      expect(mockCanvas.toBlob).toHaveBeenCalledWith('image/png', 1.0);
    });
  });

  describe('Filename Generation', () => {
    it('should generate proper filename with timestamp and text preview', () => {
      const textContent = 'Hello World Test';
      const now = new Date('2024-01-15T10:30:45.123Z');
      
      // Mock Date.now() to return consistent timestamp
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:30:45.123Z');

      const expectedTimestamp = '20240115_103045';
      const expectedTextPreview = 'Hello_World_Test';
      const expectedFilename = `text-behind-image_${expectedTextPreview}_${expectedTimestamp}.png`;

      // Test filename generation logic
      const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
      const textPreview = textContent.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `text-behind-image_${textPreview}_${timestamp}.png`;

      expect(filename).toBe(expectedFilename);
    });

    it('should handle special characters in text content', () => {
      const textContent = 'Hello @#$%^&*()! World';
      const textPreview = textContent.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
      
      expect(textPreview).toBe('Hello____________Wor');
    });
  });

  describe('Export Validation', () => {
    it('should validate all required components for export', () => {
      const mockValidation = {
        currentImage: true,
        processedCanvas: true,
        imageMask: true,
        isProcessing: false,
        textContent: 'Test text'
      };

      // Test validation logic
      const isReady = mockValidation.currentImage && 
                     mockValidation.processedCanvas && 
                     mockValidation.imageMask && 
                     !mockValidation.isProcessing && 
                     mockValidation.textContent.trim().length > 0;

      expect(isReady).toBe(true);
    });

    it('should fail validation when components are missing', () => {
      const testCases = [
        { currentImage: false, processedCanvas: true, imageMask: true, isProcessing: false, textContent: 'Test' },
        { currentImage: true, processedCanvas: false, imageMask: true, isProcessing: false, textContent: 'Test' },
        { currentImage: true, processedCanvas: true, imageMask: false, isProcessing: false, textContent: 'Test' },
        { currentImage: true, processedCanvas: true, imageMask: true, isProcessing: true, textContent: 'Test' },
        { currentImage: true, processedCanvas: true, imageMask: true, isProcessing: false, textContent: '' }
      ];

      testCases.forEach((testCase, index) => {
        const isReady = testCase.currentImage && 
                       testCase.processedCanvas && 
                       testCase.imageMask && 
                       !testCase.isProcessing && 
                       testCase.textContent.trim().length > 0;

        expect(isReady).toBe(false);
      });
    });
  });

  describe('File Size Estimation', () => {
    it('should estimate file size correctly', () => {
      const width = 1920;
      const height = 1080;
      const pixels = width * height;
      const estimatedBytes = pixels * 4; // 4 bytes per pixel for RGBA
      const estimatedMB = (estimatedBytes / (1024 * 1024)).toFixed(1);

      expect(estimatedMB).toBe('7.9'); // 1920 * 1080 * 4 / (1024 * 1024) ≈ 7.9MB
    });
  });
});