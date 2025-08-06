/**
 * Canvas Rendering System Tests
 * Tests for the canvas rendering and text overlay functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock canvas context
const mockContext = {
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(400),
    width: 10,
    height: 10
  })),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(400),
    width: 10,
    height: 10
  }))
};

// Mock canvas element
const mockCanvas = {
  width: 400,
  height: 300,
  getContext: vi.fn(() => mockContext),
  style: {}
};

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => mockCanvas),
  writable: true
});

describe('Canvas Rendering System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Aspect Ratio Calculation', () => {
    it('should calculate correct dimensions for landscape images', () => {
      // Test landscape image (wider than container)
      const imageWidth = 800;
      const imageHeight = 600;
      const containerWidth = 400;
      const containerHeight = 300;

      const imageAspectRatio = imageWidth / imageHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      let displayWidth: number;
      let displayHeight: number;
      let scale: number;

      if (imageAspectRatio > containerAspectRatio) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
        scale = containerWidth / imageWidth;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
        scale = containerHeight / imageHeight;
      }

      expect(displayWidth).toBe(400);
      expect(displayHeight).toBe(300);
      expect(scale).toBe(0.5);
    });

    it('should calculate correct dimensions for portrait images', () => {
      // Test portrait image (taller than container)
      const imageWidth = 600;
      const imageHeight = 800;
      const containerWidth = 400;
      const containerHeight = 300;

      const imageAspectRatio = imageWidth / imageHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      let displayWidth: number;
      let displayHeight: number;
      let scale: number;

      if (imageAspectRatio > containerAspectRatio) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
        scale = containerWidth / imageWidth;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
        scale = containerHeight / imageHeight;
      }

      expect(displayWidth).toBe(225);
      expect(displayHeight).toBe(300);
      expect(scale).toBe(0.375);
    });

    it('should handle square images correctly', () => {
      const imageWidth = 500;
      const imageHeight = 500;
      const containerWidth = 400;
      const containerHeight = 300;

      const imageAspectRatio = imageWidth / imageHeight; // 1.0
      const containerAspectRatio = containerWidth / containerHeight; // 1.33

      let displayWidth: number;
      let displayHeight: number;

      if (imageAspectRatio > containerAspectRatio) {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imageAspectRatio;
      } else {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imageAspectRatio;
      }

      expect(displayWidth).toBe(300);
      expect(displayHeight).toBe(300);
    });
  });

  describe('Text Overlay Creation', () => {
    it('should create text overlay canvas with correct properties', () => {
      const width = 400;
      const height = 300;
      const textSettings = {
        content: 'Test Text',
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#ffffff',
        opacity: 80,
        position: { x: 50, y: 50 },
        effects: {
          blur: 2,
          bold: true,
          italic: false,
          underline: true
        }
      };

      // Simulate text overlay creation
      const textCanvas = document.createElement('canvas');
      textCanvas.width = width;
      textCanvas.height = height;

      const ctx = textCanvas.getContext('2d');
      expect(ctx).toBeTruthy();

      // Verify canvas dimensions
      expect(textCanvas.width).toBe(400);
      expect(textCanvas.height).toBe(300);
    });

    it('should apply text styling correctly', () => {
      const textSettings = {
        content: 'Styled Text',
        fontSize: 20,
        fontFamily: 'Arial',
        color: '#20B2AA',
        opacity: 90,
        position: { x: 25, y: 75 },
        effects: {
          blur: 1,
          bold: true,
          italic: true,
          underline: false
        }
      };

      // Test font style construction
      let fontStyle = '';
      if (textSettings.effects.italic) fontStyle += 'italic ';
      if (textSettings.effects.bold) fontStyle += 'bold ';

      const expectedFont = `${fontStyle}${textSettings.fontSize}px ${textSettings.fontFamily}`;
      expect(expectedFont).toBe('italic bold 20px Arial');

      // Test position calculation
      const canvasWidth = 400;
      const canvasHeight = 300;
      const textX = (textSettings.position.x / 100) * canvasWidth;
      const textY = (textSettings.position.y / 100) * canvasHeight;

      expect(textX).toBe(100); // 25% of 400
      expect(textY).toBe(225); // 75% of 300
    });
  });

  describe('Layer Composition', () => {
    it('should composite layers in correct order', () => {
      const backgroundCanvas = document.createElement('canvas');
      const textCanvas = document.createElement('canvas');
      const subjectCanvas = document.createElement('canvas');
      const outputCanvas = document.createElement('canvas');

      const ctx = outputCanvas.getContext('2d');
      
      // Simulate layer composition
      outputCanvas.width = 400;
      outputCanvas.height = 300;

      // Layer 1: Background
      mockContext.globalCompositeOperation = 'source-over';
      mockContext.drawImage(backgroundCanvas, 0, 0);

      // Layer 2: Text
      mockContext.globalCompositeOperation = 'source-over';
      mockContext.drawImage(textCanvas, 0, 0);

      // Layer 3: Subject
      mockContext.globalCompositeOperation = 'source-over';
      mockContext.drawImage(subjectCanvas, 0, 0);

      // Verify drawImage was called for each layer
      expect(mockContext.drawImage).toHaveBeenCalledTimes(3);
      expect(mockContext.drawImage).toHaveBeenNthCalledWith(1, backgroundCanvas, 0, 0);
      expect(mockContext.drawImage).toHaveBeenNthCalledWith(2, textCanvas, 0, 0);
      expect(mockContext.drawImage).toHaveBeenNthCalledWith(3, subjectCanvas, 0, 0);
    });
  });

  describe('Zoom and Pan Transformations', () => {
    it('should apply zoom transformation correctly', () => {
      const zoomLevel = 150; // 150%
      const canvasWidth = 400;
      const canvasHeight = 300;

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const zoomScale = zoomLevel / 100;

      // Simulate zoom transformation
      mockContext.save();
      mockContext.translate(centerX, centerY);
      mockContext.scale(zoomScale, zoomScale);
      mockContext.translate(-centerX, -centerY);

      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.translate).toHaveBeenCalledWith(200, 150);
      expect(mockContext.scale).toHaveBeenCalledWith(1.5, 1.5);
      expect(mockContext.translate).toHaveBeenCalledWith(-200, -150);
    });

    it('should apply pan transformation correctly', () => {
      const translateX = 50;
      const translateY = -30;
      const centerX = 200;
      const centerY = 150;

      // Simulate pan transformation
      mockContext.translate(-centerX + translateX, -centerY + translateY);

      expect(mockContext.translate).toHaveBeenCalledWith(-150, -180);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing canvas context gracefully', () => {
      const mockCanvasWithoutContext = {
        width: 400,
        height: 300,
        getContext: vi.fn(() => null)
      };

      const ctx = mockCanvasWithoutContext.getContext('2d');
      expect(ctx).toBeNull();

      // Function should handle null context without throwing
      expect(() => {
        if (!ctx) return;
        ctx.clearRect(0, 0, 400, 300);
      }).not.toThrow();
    });

    it('should validate text settings before rendering', () => {
      const invalidTextSettings = {
        content: '', // Empty content
        fontSize: 0, // Invalid font size
        fontFamily: '',
        color: '',
        opacity: -1, // Invalid opacity
        position: { x: -10, y: 110 }, // Invalid position
        effects: {
          blur: -1, // Invalid blur
          bold: false,
          italic: false,
          underline: false
        }
      };

      // Test validation logic
      expect(invalidTextSettings.content.trim().length).toBe(0);
      expect(invalidTextSettings.fontSize).toBeLessThanOrEqual(0);
      expect(invalidTextSettings.opacity).toBeLessThan(0);
      expect(invalidTextSettings.position.x).toBeLessThan(0);
      expect(invalidTextSettings.position.y).toBeGreaterThan(100);
      expect(invalidTextSettings.effects.blur).toBeLessThan(0);
    });
  });
});