import { useEffect, useRef } from "react";
import { segmentSubject, loadImage, renderTextBehindSubject } from "@/lib/backgroundRemoval";

export const HtmlImageEditor = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set up the HTML content
    containerRef.current.innerHTML = `
      <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: #1F2121;
            color: #FFFFFF;
            min-height: 100vh;
            line-height: 1.5;
            overflow: hidden;
        }

        .app-container {
            display: flex;
            height: 100vh;
        }

        /* Left Sidebar - Perplexity Style */
        .sidebar {
            width: 340px;
            background: #191919;
            border-right: 1px solid #2D2D2D;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }

        .sidebar::-webkit-scrollbar {
            width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
            background: transparent;
        }

        .sidebar::-webkit-scrollbar-thumb {
            background: #3D3D3D;
            border-radius: 3px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 32px;
            font-size: 18px;
            font-weight: 600;
            color: #FFFFFF;
        }

        .logo-icon {
            width: 28px;
            height: 28px;
            background: #20B2AA;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }

        .section {
            margin-bottom: 28px;
        }

        .section-title {
            font-size: 13px;
            font-weight: 500;
            color: #8B8B8B;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .control-group {
            margin-bottom: 20px;
        }

        .control-label {
            display: block;
            font-size: 14px;
            font-weight: 400;
            color: #CCCCCC;
            margin-bottom: 8px;
        }

        .input-field {
            width: 100%;
            background: #2A2A2A;
            border: 1px solid #3D3D3D;
            border-radius: 8px;
            padding: 12px 14px;
            color: #FFFFFF;
            font-size: 14px;
            transition: all 0.2s ease;
        }

        .input-field:focus {
            outline: none;
            border-color: #20B2AA;
            background: #333333;
        }

        .input-field::placeholder {
            color: #666666;
        }

        .select-field {
            width: 100%;
            background: #2A2A2A;
            border: 1px solid #3D3D3D;
            border-radius: 8px;
            padding: 12px 14px;
            color: #FFFFFF;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .select-field:focus {
            outline: none;
            border-color: #20B2AA;
            background: #333333;
        }

        .slider-container {
            position: relative;
            padding: 4px 0;
        }

        .slider {
            width: 100%;
            height: 6px;
            background: #3D3D3D;
            border-radius: 3px;
            outline: none;
            -webkit-appearance: none;
            appearance: none;
        }

        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            background: #20B2AA;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
            background: #1A9A92;
            transform: scale(1.1);
        }

        .slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: #20B2AA;
            border-radius: 50%;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
        }

        .slider-value {
            position: absolute;
            right: 0;
            top: -8px;
            font-size: 11px;
            color: #20B2AA;
            font-weight: 500;
            background: #2A2A2A;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #3D3D3D;
        }

        .toggle-group {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }

        .toggle-btn {
            background: #2A2A2A;
            border: 1px solid #3D3D3D;
            border-radius: 6px;
            padding: 8px 14px;
            color: #8B8B8B;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .toggle-btn.active {
            background: #20B2AA;
            border-color: #20B2AA;
            color: white;
        }

        .toggle-btn:hover:not(.active) {
            background: #333333;
            border-color: #4D4D4D;
            color: #CCCCCC;
        }

        .color-input {
            width: 100%;
            height: 44px;
            background: #2A2A2A;
            border: 1px solid #3D3D3D;
            border-radius: 8px;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
        }

        .color-input::-webkit-color-swatch {
            border: none;
            border-radius: 6px;
            margin: 2px;
        }

        /* Export Section */
        .export-section {
            margin-top: auto;
            padding-top: 24px;
            border-top: 1px solid #2D2D2D;
        }

        .btn {
            width: 100%;
            background: #20B2AA;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 12px;
        }

        .btn:hover {
            background: #1A9A92;
        }

        .btn:active {
            transform: translateY(1px);
        }

        .btn-secondary {
            background: #2A2A2A;
            color: #CCCCCC;
            border: 1px solid #3D3D3D;
        }

        .btn-secondary:hover {
            background: #333333;
            border-color: #4D4D4D;
        }

        /* Main Content - Right Side - REDESIGNED */
        .main-content {
            flex: 1;
            background: #1F2121;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            position: relative;
            overflow: hidden;
        }

        .viewport-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-radius: 16px;
            background: #0F0F0F;
            border: 1px solid #2D2D2D;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .canvas-container {
            position: relative;
            transition: transform 0.3s ease;
            transform-origin: center center;
            cursor: grab;
        }

        .canvas-container.dragging {
            cursor: grabbing;
        }

        .canvas {
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%);
            border-radius: 12px;
            max-width: 100%;
            max-height: 100%;
        }

        .sample-image {
            display: block;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 12px;
        }

        .text-overlay, .text-behind {
            position: absolute;
            font-size: 48px;
            font-weight: bold;
            color: white;
            text-align: center;
            white-space: nowrap;
            pointer-events: none;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            transition: all 0.3s ease;
        }

        .text-behind {
            z-index: 1;
        }

        .text-overlay {
            z-index: 3;
        }

        .upload-area {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(31, 33, 33, 0.9);
            backdrop-filter: blur(10px);
            border: 2px dashed #3D3D3D;
            transition: all 0.3s ease;
            cursor: pointer;
            border-radius: 16px;
            padding: 60px;
            min-width: 300px;
            min-height: 200px;
        }

        .upload-area:hover {
            border-color: #20B2AA;
            background: rgba(32, 178, 170, 0.05);
        }

        .upload-area.dragover {
            border-color: #20B2AA;
            background: rgba(32, 178, 170, 0.1);
            transform: translate(-50%, -50%) scale(1.02);
        }

        .upload-icon {
            width: 56px;
            height: 56px;
            background: #2A2A2A;
            border: 1px solid #3D3D3D;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            color: #8B8B8B;
            transition: all 0.3s ease;
        }

        .upload-area:hover .upload-icon {
            background: #20B2AA;
            border-color: #20B2AA;
            color: white;
            transform: scale(1.05);
        }

        .upload-text {
            font-size: 16px;
            font-weight: 500;
            color: #FFFFFF;
            margin-bottom: 6px;
            text-align: center;
        }

        .upload-hint {
            font-size: 13px;
            color: #8B8B8B;
            text-align: center;
        }

        .file-input {
            display: none;
        }

        /* Status and Zoom Indicators */
        .status-indicator {
            position: absolute;
            top: 16px;
            right: 16px;
            padding: 6px 12px;
            background: rgba(42, 42, 42, 0.9);
            border: 1px solid #3D3D3D;
            border-radius: 20px;
            font-size: 12px;
            color: #8B8B8B;
            backdrop-filter: blur(10px);
            display: none;
            z-index: 10;
        }

        .status-indicator.active {
            display: block;
            color: #20B2AA;
            border-color: #20B2AA;
        }

        .zoom-indicator {
            position: absolute;
            bottom: 16px;
            right: 16px;
            padding: 6px 12px;
            background: rgba(42, 42, 42, 0.9);
            border: 1px solid #3D3D3D;
            border-radius: 20px;
            font-size: 12px;
            color: #CCCCCC;
            backdrop-filter: blur(10px);
            z-index: 10;
            display: none;
        }

        .zoom-indicator.visible {
            display: block;
        }

        .zoom-controls {
            position: absolute;
            bottom: 16px;
            left: 16px;
            display: flex;
            gap: 8px;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .viewport-container:hover .zoom-controls {
            opacity: 1;
        }

        .zoom-btn {
            width: 36px;
            height: 36px;
            background: rgba(42, 42, 42, 0.9);
            border: 1px solid #3D3D3D;
            border-radius: 50%;
            color: #CCCCCC;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: bold;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        }

        .zoom-btn:hover {
            background: #20B2AA;
            border-color: #20B2AA;
            color: white;
        }

        .instructions {
            position: absolute;
            top: 16px;
            left: 16px;
            padding: 8px 12px;
            background: rgba(42, 42, 42, 0.9);
            border: 1px solid #3D3D3D;
            border-radius: 8px;
            font-size: 11px;
            color: #8B8B8B;
            backdrop-filter: blur(10px);
            z-index: 10;
            max-width: 200px;
            line-height: 1.4;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .viewport-container:hover .instructions {
            opacity: 1;
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .sidebar {
                width: 300px;
            }
            
            .main-content {
                padding: 20px;
            }
        }

        @media (max-width: 768px) {
            .app-container {
                flex-direction: column;
                height: auto;
                min-height: 100vh;
            }

            .sidebar {
                width: 100%;
                border-right: none;
                border-bottom: 1px solid #2D2D2D;
                padding: 20px;
                height: auto;
                overflow-y: visible;
            }

            .export-section {
                margin-top: 24px;
                padding-top: 20px;
            }

            .main-content {
                padding: 20px;
                min-height: 60vh;
            }

            .instructions {
                display: none;
            }
        }

        /* Animations */
        @keyframes fadeIn {
            from { 
                opacity: 0; 
                transform: translateY(20px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        .fade-in {
            animation: fadeIn 0.4s ease-out;
        }

        .pulse {
            animation: pulse 2s infinite;
        }

        /* Focus states for accessibility */
        .input-field:focus,
        .select-field:focus,
        .btn:focus,
        .toggle-btn:focus {
            box-shadow: 0 0 0 2px rgba(32, 178, 170, 0.3);
        }
      </style>

      <div class="app-container">
        <!-- Left Sidebar -->
        <div class="sidebar">
            <div class="logo">
                <div class="logo-icon">TB</div>
                Text Behind Image
            </div>

            <div class="section">
                <div class="section-title">Text Settings</div>
                
                <div class="control-group">
                    <label class="control-label">Text Content</label>
                    <input type="text" class="input-field" id="textInput" placeholder="Enter your text..." value="Your text here">
                </div>

                <div class="control-group">
                    <label class="control-label">Font Family</label>
                    <select class="select-field" id="fontFamily">
                        <option value="SF Pro Display">SF Pro Display</option>
                        <option value="Inter">Inter</option>
                        <option value="Arial" selected>Arial</option>
                        <option value="Helvetica Neue">Helvetica Neue</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Impact">Impact</option>
                    </select>
                </div>

                <div class="control-group">
                    <label class="control-label">Font Size</label>
                    <div class="slider-container">
                        <input type="range" class="slider" id="fontSize" min="16" max="120" value="48">
                        <div class="slider-value"><span id="fontSizeValue">48</span>px</div>
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Text Style</label>
                    <div class="toggle-group">
                        <button class="toggle-btn" id="boldBtn">B</button>
                        <button class="toggle-btn" id="italicBtn">I</button>
                        <button class="toggle-btn" id="underlineBtn">U</button>
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Text Color</label>
                    <input type="color" class="color-input" id="textColor" value="#ffffff">
                </div>
            </div>

            <div class="section">
                <div class="section-title">Position & Effects</div>
                
                <div class="control-group">
                    <label class="control-label">Horizontal Position</label>
                    <div class="slider-container">
                        <input type="range" class="slider" id="horizontalPos" min="0" max="100" value="50">
                        <div class="slider-value"><span id="horizontalValue">50</span>%</div>
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Vertical Position</label>
                    <div class="slider-container">
                        <input type="range" class="slider" id="verticalPos" min="0" max="100" value="50">
                        <div class="slider-value"><span id="verticalValue">50</span>%</div>
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Opacity</label>
                    <div class="slider-container">
                        <input type="range" class="slider" id="opacity" min="0" max="100" value="80">
                        <div class="slider-value"><span id="opacityValue">80</span>%</div>
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Depth Blur</label>
                    <div class="slider-container">
                        <input type="range" class="slider" id="depthBlur" min="0" max="15" value="3" step="0.5">
                        <div class="slider-value"><span id="depthBlurValue">3</span>px</div>
                    </div>
                </div>
            </div>

            <!-- Export Section -->
            <div class="export-section">
                <div class="section-title">Export</div>
                <button class="btn" id="exportBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                    </svg>
                    Download Image
                </button>
                <button class="btn btn-secondary" id="uploadBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                    </svg>
                    Upload New Image
                </button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="viewport-container fade-in">
                <div class="status-indicator" id="statusIndicator">Ready</div>
                <div class="zoom-indicator" id="zoomIndicator">100%</div>
                
                <div class="instructions">
                    Ctrl + Scroll to zoom<br>
                    Click and drag to pan
                </div>
                
                <div class="zoom-controls">
                    <div class="zoom-btn" id="zoomOutBtn">−</div>
                    <div class="zoom-btn" id="zoomInBtn">+</div>
                    <div class="zoom-btn" id="resetZoomBtn">⌂</div>
                </div>

                <div class="canvas-container" id="canvasContainer">
                    <div class="canvas" id="canvas">
                        <div class="upload-area" id="uploadArea">
                            <div class="upload-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                                </svg>
                            </div>
                            <div class="upload-text">Drop your image here</div>
                            <div class="upload-hint">Supports JPG, PNG, WEBP</div>
                        </div>
                        
                        <div class="text-behind" id="textBehind"></div>
                        <div class="text-overlay" id="textOverlay"></div>
                    </div>
                </div>
            </div>

            <input type="file" class="file-input" id="fileInput" accept="image/*">
        </div>
      </div>
    `;

    // Now add the JavaScript functionality integrated with React services
    const textInput = containerRef.current.querySelector('#textInput') as HTMLInputElement;
    const fontFamily = containerRef.current.querySelector('#fontFamily') as HTMLSelectElement;
    const fontSize = containerRef.current.querySelector('#fontSize') as HTMLInputElement;
    const fontSizeValue = containerRef.current.querySelector('#fontSizeValue') as HTMLSpanElement;
    const boldBtn = containerRef.current.querySelector('#boldBtn') as HTMLButtonElement;
    const italicBtn = containerRef.current.querySelector('#italicBtn') as HTMLButtonElement;
    const underlineBtn = containerRef.current.querySelector('#underlineBtn') as HTMLButtonElement;
    const textColor = containerRef.current.querySelector('#textColor') as HTMLInputElement;
    const horizontalPos = containerRef.current.querySelector('#horizontalPos') as HTMLInputElement;
    const horizontalValue = containerRef.current.querySelector('#horizontalValue') as HTMLSpanElement;
    const verticalPos = containerRef.current.querySelector('#verticalPos') as HTMLInputElement;
    const verticalValue = containerRef.current.querySelector('#verticalValue') as HTMLSpanElement;
    const opacity = containerRef.current.querySelector('#opacity') as HTMLInputElement;
    const opacityValue = containerRef.current.querySelector('#opacityValue') as HTMLSpanElement;
    const depthBlur = containerRef.current.querySelector('#depthBlur') as HTMLInputElement;
    const depthBlurValue = containerRef.current.querySelector('#depthBlurValue') as HTMLSpanElement;
    
    const canvas = containerRef.current.querySelector('#canvas') as HTMLDivElement;
    const canvasContainer = containerRef.current.querySelector('#canvasContainer') as HTMLDivElement;
    const uploadArea = containerRef.current.querySelector('#uploadArea') as HTMLDivElement;
    const statusIndicator = containerRef.current.querySelector('#statusIndicator') as HTMLDivElement;
    const zoomIndicator = containerRef.current.querySelector('#zoomIndicator') as HTMLDivElement;
    const textBehind = containerRef.current.querySelector('#textBehind') as HTMLDivElement;
    const textOverlay = containerRef.current.querySelector('#textOverlay') as HTMLDivElement;
    const uploadBtn = containerRef.current.querySelector('#uploadBtn') as HTMLButtonElement;
    const exportBtn = containerRef.current.querySelector('#exportBtn') as HTMLButtonElement;
    const fileInput = containerRef.current.querySelector('#fileInput') as HTMLInputElement;
    const zoomInBtn = containerRef.current.querySelector('#zoomInBtn') as HTMLDivElement;
    const zoomOutBtn = containerRef.current.querySelector('#zoomOutBtn') as HTMLDivElement;
    const resetZoomBtn = containerRef.current.querySelector('#resetZoomBtn') as HTMLDivElement;

    let currentImage: HTMLImageElement | null = null;
    let subjectMask: ImageData | null = null;
    let processedCanvas: HTMLCanvasElement | null = null;
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    let zoomLevel = 1;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let translateX = 0;
    let translateY = 0;

    // Initialize
    updateText();
    updateStatus('Ready');

    function updateText() {
      const text = textInput.value;
      
      if (!text) {
          textBehind.style.display = 'none';
          textOverlay.style.display = 'none';
          return;
      }
      
      textBehind.style.display = 'block';
      textOverlay.style.display = 'block';
      
      const fontWeight = isBold ? 'bold' : 'normal';
      const fontStyle = isItalic ? 'italic' : 'normal';
      const textDecoration = isUnderline ? 'underline' : 'none';
      
      const style = {
          fontFamily: fontFamily.value,
          fontSize: fontSize.value + 'px',
          fontWeight: fontWeight,
          fontStyle: fontStyle,
          textDecoration: textDecoration,
          color: textColor.value,
          left: horizontalPos.value + '%',
          top: verticalPos.value + '%',
          opacity: (parseInt(opacity.value) / 100).toString(),
          filter: `blur(${depthBlur.value}px)`,
          transform: 'translate(-50%, -50%)'
      };

      // Apply styles to both text elements
      [textBehind, textOverlay].forEach(element => {
          element.textContent = text;
          Object.assign(element.style, style);
      });

      // Adjust z-index based on image presence and AI processing
      if (currentImage && subjectMask) {
          textBehind.style.zIndex = '1';
          textOverlay.style.zIndex = '3';
      }
    }

    function updateStatus(message: string) {
        statusIndicator.textContent = message;
        statusIndicator.classList.add('active');
        setTimeout(() => {
            statusIndicator.classList.remove('active');
        }, 2000);
    }

    function updateTransform() {
        canvasContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
        zoomIndicator.textContent = `${Math.round(zoomLevel * 100)}%`;
        zoomIndicator.classList.toggle('visible', zoomLevel !== 1 || translateX !== 0 || translateY !== 0);
    }

    function handleZoom(e: WheelEvent) {
        if (!e.ctrlKey) return;
        
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        adjustZoom(delta);
    }

    function adjustZoom(delta: number) {
        const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
        zoomLevel = newZoom;
        updateTransform();
    }

    function handleMouseDown(e: MouseEvent) {
        if (!currentImage) return;
        
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvasContainer.classList.add('dragging');
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        
        translateX += deltaX;
        translateY += deltaY;
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        updateTransform();
    }

    function handleMouseUp() {
        isDragging = false;
        canvasContainer.classList.remove('dragging');
    }

    function resetView() {
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
    }

    async function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            await loadImageFile(file);
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer?.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
            loadImageFile(files[0]);
        }
    }

    async function loadImageFile(file: File) {
        updateStatus('Loading image...');
        
        try {
            const img = await loadImage(file);
            
            if (currentImage) {
                currentImage.remove();
            }
            
            currentImage = img;
            currentImage.className = 'sample-image';
            currentImage.style.zIndex = '2';
            
            // Set canvas dimensions based on image aspect ratio
            const imgWidth = currentImage.naturalWidth;
            const imgHeight = currentImage.naturalHeight;
            const aspectRatio = imgWidth / imgHeight;
            
            const maxWidth = canvas.parentElement!.clientWidth - 40;
            const maxHeight = canvas.parentElement!.clientHeight - 40;
            
            let canvasWidth, canvasHeight;
            
            if (aspectRatio > maxWidth / maxHeight) {
                canvasWidth = Math.min(maxWidth, imgWidth);
                canvasHeight = canvasWidth / aspectRatio;
            } else {
                canvasHeight = Math.min(maxHeight, imgHeight);
                canvasWidth = canvasHeight * aspectRatio;
            }
            
            canvas.style.width = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';
            
            currentImage.style.opacity = '0';
            currentImage.style.transition = 'opacity 0.5s ease';
            
            canvas.appendChild(currentImage);
            uploadArea.style.display = 'none';
            
            resetView();
            
            setTimeout(() => {
                currentImage!.style.opacity = '1';
                updateStatus('Image loaded - processing with AI...');
            }, 100);

            // Process with AI background removal
            try {
                updateStatus('Analyzing image with AI...');
                const segmentResult = await segmentSubject(img);
                subjectMask = segmentResult.mask;
                processedCanvas = segmentResult.canvas;
                updateStatus('AI processing complete!');
                updateText(); // Refresh text positioning
            } catch (error) {
                console.error('AI processing failed:', error);
                updateStatus('AI processing failed - using basic mode');
                subjectMask = null;
                processedCanvas = null;
            }
            
        } catch (error) {
            console.error('Error loading image:', error);
            updateStatus('Error loading image');
        }
    }

    function exportImage() {
        if (!currentImage && !textInput.value) {
            updateStatus('Add image and text first');
            return;
        }
        
        updateStatus('Exporting...');
        
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d')!;
        
        if (currentImage) {
            exportCanvas.width = currentImage.naturalWidth;
            exportCanvas.height = currentImage.naturalHeight;
            
            ctx.fillStyle = '#0F0F0F';
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            
            if (processedCanvas && subjectMask) {
                // Use AI-processed version with text behind subject
                const resultCanvas = renderTextBehindSubject(processedCanvas, subjectMask, textInput.value, {
                    fontSize: parseInt(fontSize.value),
                    fontFamily: fontFamily.value,
                    color: textColor.value,
                    opacity: parseInt(opacity.value),
                    x: (parseInt(horizontalPos.value) / 100) * exportCanvas.width,
                    y: (parseInt(verticalPos.value) / 100) * exportCanvas.height,
                    blur: parseFloat(depthBlur.value),
                    bold: isBold,
                    italic: isItalic,
                    underline: isUnderline
                });
                
                ctx.drawImage(resultCanvas, 0, 0);
            } else {
                // Fallback to simple overlay
                ctx.drawImage(currentImage, 0, 0);
                
                if (textInput.value) {
                    const text = textInput.value;
                    const scaleFactor = Math.min(exportCanvas.width / 800, exportCanvas.height / 600);
                    const scaledFontSize = parseInt(fontSize.value) * scaleFactor;
                    
                    let fontStyle = '';
                    if (isItalic) fontStyle += 'italic ';
                    if (isBold) fontStyle += 'bold ';
                    fontStyle += `${scaledFontSize}px ${fontFamily.value}`;
                    
                    ctx.font = fontStyle;
                    ctx.fillStyle = textColor.value;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    const x = (parseInt(horizontalPos.value) / 100) * exportCanvas.width;
                    const y = (parseInt(verticalPos.value) / 100) * exportCanvas.height;
                    
                    ctx.globalAlpha = parseInt(opacity.value) / 100;
                    if (parseFloat(depthBlur.value) > 0) {
                        ctx.filter = `blur(${parseFloat(depthBlur.value) * scaleFactor}px)`;
                    }
                    
                    ctx.fillText(text, x, y);
                }
            }
        }
        
        const link = document.createElement('a');
        link.download = 'text-behind-image.png';
        link.href = exportCanvas.toDataURL('image/png', 1.0);
        link.click();
        
        updateStatus('Export complete');
    }

    // Event Listeners
    textInput?.addEventListener('input', () => {
        updateText();
        updateStatus(textInput.value ? 'Text updated' : 'Ready');
    });
    
    fontFamily?.addEventListener('change', updateText);
    fontSize?.addEventListener('input', () => {
        fontSizeValue.textContent = fontSize.value;
        updateText();
    });
    textColor?.addEventListener('change', updateText);
    
    horizontalPos?.addEventListener('input', () => {
        horizontalValue.textContent = horizontalPos.value;
        updateText();
    });
    
    verticalPos?.addEventListener('input', () => {
        verticalValue.textContent = verticalPos.value;
        updateText();
    });
    
    opacity?.addEventListener('input', () => {
        opacityValue.textContent = opacity.value;
        updateText();
    });
    
    depthBlur?.addEventListener('input', () => {
        depthBlurValue.textContent = depthBlur.value;
        updateText();
    });

    boldBtn?.addEventListener('click', () => {
        isBold = !isBold;
        boldBtn.classList.toggle('active', isBold);
        updateText();
    });

    italicBtn?.addEventListener('click', () => {
        isItalic = !isItalic;
        italicBtn.classList.toggle('active', isItalic);
        updateText();
    });

    underlineBtn?.addEventListener('click', () => {
        isUnderline = !isUnderline;
        underlineBtn.classList.toggle('active', isUnderline);
        updateText();
    });

    // File upload
    uploadBtn?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', handleFileSelect);
    
    uploadArea?.addEventListener('click', () => fileInput?.click());
    uploadArea?.addEventListener('dragover', handleDragOver);
    uploadArea?.addEventListener('drop', handleDrop);
    uploadArea?.addEventListener('dragenter', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea?.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (!uploadArea.contains(e.relatedTarget as Node)) {
            uploadArea.classList.remove('dragover');
        }
    });

    // Zoom and Pan functionality
    canvasContainer?.addEventListener('wheel', handleZoom);
    canvasContainer?.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    zoomInBtn?.addEventListener('click', () => adjustZoom(0.1));
    zoomOutBtn?.addEventListener('click', () => adjustZoom(-0.1));
    resetZoomBtn?.addEventListener('click', resetView);

    exportBtn?.addEventListener('click', exportImage);

    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />;
};