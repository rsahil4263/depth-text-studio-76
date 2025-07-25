export interface AdvancedTextSettings {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  blur: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  x: number;
  y: number;
}

export const processImageWithAdvancedText = async (
  imageFile: File,
  settings: AdvancedTextSettings
): Promise<{ canvas: HTMLCanvasElement; imageElement: HTMLImageElement }> => {
  try {
    console.log('Processing image with advanced text rendering...');
    
    // Load the image
    const imageElement = await loadImageFromBlob(imageFile);
    
    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    
    // Draw the original image
    ctx.drawImage(imageElement, 0, 0);
    
    // Apply advanced text rendering with enhanced effects
    renderAdvancedText(ctx, canvas, settings);
    
    console.log('Advanced text processing completed successfully');
    return { canvas, imageElement };
  } catch (error) {
    console.error('Error processing image with advanced text:', error);
    throw error;
  }
};

const renderAdvancedText = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: AdvancedTextSettings
) => {
  // Calculate position from percentage to pixels
  const x = (settings.x / 100) * canvas.width;
  const y = (settings.y / 100) * canvas.height;
  
  // Build font string
  let fontStyle = '';
  if (settings.italic) fontStyle += 'italic ';
  if (settings.bold) fontStyle += 'bold ';
  fontStyle += `${settings.fontSize}px ${settings.fontFamily}`;
  
  ctx.font = fontStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Apply blur effect using shadow
  if (settings.blur > 0) {
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = settings.blur * 3; // Enhanced blur effect
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  
  // Set opacity and color
  const alpha = (settings.opacity / 100).toString();
  const color = settings.color + Math.round(settings.opacity * 2.55).toString(16).padStart(2, '0');
  ctx.fillStyle = color;
  
  // Create multiple text layers for enhanced depth effect
  for (let i = 0; i < 3; i++) {
    const layerOpacity = (settings.opacity / 100) * (1 - i * 0.2);
    const layerSize = settings.fontSize + i * 2;
    const layerBlur = settings.blur + i;
    
    ctx.globalAlpha = layerOpacity;
    ctx.shadowBlur = layerBlur * 3;
    
    // Slightly offset each layer for depth
    const offsetX = x + i * 0.5;
    const offsetY = y + i * 0.5;
    
    ctx.fillText(settings.text, offsetX, offsetY);
    
    // Add stroke for underline effect
    if (settings.underline && i === 0) {
      const textWidth = ctx.measureText(settings.text).width;
      ctx.beginPath();
      ctx.moveTo(x - textWidth / 2, y + settings.fontSize * 0.2);
      ctx.lineTo(x + textWidth / 2, y + settings.fontSize * 0.2);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, settings.fontSize / 20);
      ctx.stroke();
    }
  }
  
  // Reset context
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
};

export const loadImageFromBlob = (blob: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
};