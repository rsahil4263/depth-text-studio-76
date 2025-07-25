import { useCallback, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Download, Type, Layers, Settings, Sparkles, Bold, Italic, Underline, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { segmentSubject, loadImage, renderTextBehindSubject } from "@/lib/backgroundRemoval";
import { processImageWithAdvancedText, type AdvancedTextSettings } from "@/lib/textBehindImageService";
import { BackgroundRemovalError, ErrorRecoveryStrategies } from "@/lib/errorHandling";
import { detectBrowser, validateBrowserCompatibility, logBrowserCompatibility, getBrowserPerformanceProfile } from "@/lib/browserCompatibility";

export const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<"loading" | "processing" | "converting" | "complete" | "error">("loading");
  const [processingStartTime, setProcessingStartTime] = useState<number>(0);
  const [processingDuration, setProcessingDuration] = useState<number>(0);
  const [subjectMask, setSubjectMask] = useState<ImageData | null>(null);
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [browserCompatibility, setBrowserCompatibility] = useState<{
    isSupported: boolean;
    browserName: string;
    warnings: string[];
    performanceProfile: ReturnType<typeof getBrowserPerformanceProfile>;
  } | null>(null);
  
  // Text editing state
  const [text, setText] = useState("Your text here");
  const [fontSize, setFontSize] = useState([48]);
  const [fontSizeInput, setFontSizeInput] = useState("48");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textOpacity, setTextOpacity] = useState([80]);
  const [textX, setTextX] = useState([50]);
  const [textY, setTextY] = useState([50]);
  const [blurStrength, setBlurStrength] = useState([3]);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  
  // Processing mode state
  const [processingMode, setProcessingMode] = useState<"ai" | "advanced">("ai");
  
  const fonts = [
    "Arial", "Helvetica", "Georgia", "Times New Roman", 
    "Courier New", "Verdana", "Impact", "Comic Sans MS"
  ];

  // Check browser compatibility on component mount
  useEffect(() => {
    try {
      // Log browser compatibility information to console
      logBrowserCompatibility();
      
      // Validate browser compatibility
      validateBrowserCompatibility();
      
      // Get browser info and performance profile
      const browserInfo = detectBrowser();
      const performanceProfile = getBrowserPerformanceProfile();
      
      setBrowserCompatibility({
        isSupported: browserInfo.isSupported,
        browserName: `${browserInfo.name} ${browserInfo.version}`,
        warnings: browserInfo.warnings,
        performanceProfile
      });
      
      // Show warnings if any
      if (browserInfo.warnings.length > 0) {
        browserInfo.warnings.forEach(warning => {
          console.warn('Browser compatibility warning:', warning);
        });
        
        // Show toast for critical warnings
        const criticalWarnings = browserInfo.warnings.filter(warning => 
          warning.includes('not support') || warning.includes('required')
        );
        
        if (criticalWarnings.length > 0) {
          toast.error(`Browser compatibility issue: ${criticalWarnings[0]}`);
        }
      }
      
    } catch (error) {
      console.error('Browser compatibility check failed:', error);
      setBrowserCompatibility({
        isSupported: false,
        browserName: 'Unknown',
        warnings: ['Browser compatibility could not be determined'],
        performanceProfile: getBrowserPerformanceProfile()
      });
      
      if (error instanceof Error) {
        toast.error(`Browser not supported: ${error.message}`);
      }
    }
  }, []);

  const processImageFile = useCallback(async (file: File) => {
    // Check browser compatibility before processing
    if (browserCompatibility && !browserCompatibility.isSupported) {
      toast.error(`Browser not supported. Please use ${browserCompatibility.browserName} or a modern browser.`);
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep("loading");
    
    // Use browser-specific messaging
    const browserName = browserCompatibility?.browserName || 'your browser';
    const expectedTime = browserCompatibility?.performanceProfile.expectedProcessingTime || 3000;
    const expectedTimeSeconds = Math.ceil(expectedTime / 1000);
    
    setStatusMessage(`Loading your image... (Expected processing time: ~${expectedTimeSeconds}s on ${browserName})`);
    setProcessingStartTime(Date.now());
    setProcessingDuration(0);
    
    try {
      // Step 1: Load image (20% progress)
      setProcessingProgress(20);
      const img = await loadImage(file);
      setImage(img);
      
      if (processingMode === "ai") {
        // Step 2: Start AI processing (40% progress)
        setProcessingStep("processing");
        setProcessingProgress(40);
        setStatusMessage("Initializing AI background removal...");
        
        // Add a small delay to show the status update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 3: Processing with AI (60% progress)
        setProcessingProgress(60);
        setStatusMessage("Analyzing image and detecting subject...");
        
        // Perform subject segmentation with progress callback
        const segmentResult = await segmentSubject(img, (step, progress) => {
          setStatusMessage(step);
          setProcessingProgress(Math.min(60 + (progress / 100) * 20, 80)); // Map to 60-80% range
        });
        
        // Step 4: Converting results (80% progress)
        setProcessingStep("converting");
        setProcessingProgress(80);
        setStatusMessage("Converting processed image to mask...");
        
        // Add a small delay to show the conversion step
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setSubjectMask(segmentResult.mask);
        setProcessedCanvas(segmentResult.canvas);
        
        // Step 5: Complete (100% progress)
        setProcessingStep("complete");
        setProcessingProgress(100);
        const duration = (Date.now() - processingStartTime) / 1000;
        setProcessingDuration(duration);
        
        // Browser-specific performance analysis
        const expectedTime = browserCompatibility?.performanceProfile.expectedProcessingTime || 3000;
        const performanceRatio = (duration * 1000) / expectedTime;
        
        let performanceNote = '';
        if (performanceRatio < 0.8) {
          performanceNote = ' (Faster than expected!)';
        } else if (performanceRatio > 1.5) {
          performanceNote = ' (Slower than expected - consider using a smaller image)';
        }
        
        // Include performance metrics in status message if available
        let statusMsg = `Subject detection complete in ${duration.toFixed(1)}s${performanceNote} Ready for text editing.`;
        if (segmentResult.metrics) {
          const metrics = segmentResult.metrics;
          if (metrics.imageSize.original.width !== metrics.imageSize.processed.width) {
            statusMsg += ` (Optimized from ${metrics.imageSize.original.width}x${metrics.imageSize.original.height})`;
          }
        }
        setStatusMessage(statusMsg);
        
        // Log performance data for cross-browser analysis
        console.log('Cross-browser performance data:', {
          browser: browserCompatibility?.browserName || 'Unknown',
          processingTime: duration * 1000,
          expectedTime,
          performanceRatio,
          imageSize: file.size,
          imageDimensions: segmentResult.metrics?.imageSize.original,
          success: true
        });
        
        // Show completion for a moment before clearing
        setTimeout(() => {
          setIsProcessing(false);
          setStatusMessage("");
          setProcessingProgress(0);
        }, 1500);
        
        toast.success("Subject detected! Add your text below.");
      } else {
        // Advanced processing mode - just load the image
        setProcessingStep("complete");
        setProcessingProgress(100);
        setStatusMessage("Image loaded successfully!");
        setSubjectMask(null);
        setProcessedCanvas(null);
        
        setTimeout(() => {
          setIsProcessing(false);
          setStatusMessage("");
          setProcessingProgress(0);
        }, 800);
        
        toast.success("Image loaded! Ready for advanced text effects.");
      }
      
    } catch (error) {
      console.error("Error processing image:", error);
      setProcessingStep("error");
      
      // Handle structured background removal errors
      if (error instanceof Error && 'type' in error) {
        const bgError = error as BackgroundRemovalError;
        
        // Use the structured error message
        setStatusMessage(bgError.userMessage);
        
        // Get recovery strategies if available
        const recoveryStrategy = ErrorRecoveryStrategies[bgError.type];
        if (recoveryStrategy && recoveryStrategy.suggestions.length > 0) {
          // Show additional help in console for debugging
          console.log('Recovery suggestions:', recoveryStrategy.suggestions);
        }
        
        // Handle auto-retry for certain error types
        if (recoveryStrategy?.autoRetry && bgError.retryable) {
          console.log(`Auto-retry scheduled for ${bgError.type} in ${recoveryStrategy.retryDelay}ms`);
          setTimeout(() => {
            if (image) {
              // Convert HTMLImageElement back to File-like object for retry
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (ctx && image) {
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                ctx.drawImage(image, 0, 0);
                canvas.toBlob((blob) => {
                  if (blob) {
                    const file = new File([blob], 'retry-image.png', { type: 'image/png' });
                    processImageFile(file);
                  }
                });
              }
            }
          }, recoveryStrategy.retryDelay);
          return; // Don't show error state if auto-retrying
        }
      } else {
        // Fallback for non-structured errors
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        setStatusMessage(errorMessage);
      }
      
      // Show error state for 4 seconds before clearing (longer to allow reading)
      setTimeout(() => {
        setIsProcessing(false);
        setStatusMessage("");
        setProcessingProgress(0);
        setProcessingStep("loading");
      }, 4000);
      
      // Note: Toast notification is already handled by the error handling service
      // No need to call toast.error here as it would be duplicate
    }
  }, [processingMode, processingStartTime]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      processImageFile(imageFile);
    } else {
      toast.error("Please upload a valid image file");
    }
  }, [processImageFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  }, [processImageFile]);

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    
    if (processingMode === "ai" && processedCanvas && subjectMask) {
      // Use AI detection with text behind subject rendering
      const resultCanvas = renderTextBehindSubject(processedCanvas, subjectMask, text, {
        fontSize: fontSize[0],
        fontFamily,
        color: textColor,
        opacity: textOpacity[0],
        x: (textX[0] / 100) * processedCanvas.width,
        y: (textY[0] / 100) * processedCanvas.height,
        blur: blurStrength[0],
        bold: textBold,
        italic: textItalic,
        underline: textUnderline
      });
      
      // Copy result to display canvas
      canvas.width = resultCanvas.width;
      canvas.height = resultCanvas.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(resultCanvas, 0, 0);
    } else {
      // Advanced processing mode or fallback - enhanced text overlay
      ctx.save();
      
      // Build font style with format handling
      let fontStyle = '';
      if (textItalic) fontStyle += 'italic ';
      if (textBold) fontStyle += 'bold ';
      fontStyle += `${fontSize[0]}px ${fontFamily}`;
      
      ctx.font = fontStyle;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Apply blur effect using shadow
      if (blurStrength[0] > 0) {
        ctx.shadowColor = textColor;
        ctx.shadowBlur = blurStrength[0] * 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // Set opacity and color
      const alpha = textOpacity[0] / 100;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = textColor;
      
      // Calculate position
      const x = (textX[0] / 100) * canvas.width;
      const y = (textY[0] / 100) * canvas.height;
      
      // Render text with multiple layers for depth effect (advanced mode)
      if (processingMode === "advanced") {
        for (let i = 0; i < 3; i++) {
          const layerOpacity = alpha * (1 - i * 0.2);
          const layerBlur = blurStrength[0] + i;
          
          ctx.globalAlpha = layerOpacity;
          ctx.shadowBlur = layerBlur * 3;
          
          // Slightly offset each layer for depth
          const offsetX = x + i * 0.5;
          const offsetY = y + i * 0.5;
          
          ctx.fillText(text, offsetX, offsetY);
        }
        
        // Add underline effect
        if (textUnderline) {
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = blurStrength[0] * 3;
          const textWidth = ctx.measureText(text).width;
          ctx.beginPath();
          ctx.moveTo(x - textWidth / 2, y + fontSize[0] * 0.2);
          ctx.lineTo(x + textWidth / 2, y + fontSize[0] * 0.2);
          ctx.strokeStyle = textColor;
          ctx.lineWidth = Math.max(1, fontSize[0] / 20);
          ctx.stroke();
        }
      } else {
        // Simple text overlay
        ctx.fillText(text, x, y);
        
        // Add underline effect
        if (textUnderline) {
          const textWidth = ctx.measureText(text).width;
          ctx.beginPath();
          ctx.moveTo(x - textWidth / 2, y + fontSize[0] * 0.2);
          ctx.lineTo(x + textWidth / 2, y + fontSize[0] * 0.2);
          ctx.strokeStyle = textColor;
          ctx.lineWidth = Math.max(1, fontSize[0] / 20);
          ctx.stroke();
        }
      }
      
      ctx.restore();
    }
  }, [image, processedCanvas, subjectMask, text, fontSize, fontFamily, textColor, textOpacity, textX, textY, blurStrength, textBold, textItalic, textUnderline, processingMode]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Update processing duration in real-time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing && processingStartTime > 0) {
      interval = setInterval(() => {
        setProcessingDuration((Date.now() - processingStartTime) / 1000);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, processingStartTime]);

  const handleFontSizeInputChange = useCallback((value: string) => {
    setFontSizeInput(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 8 && numValue <= 200) {
      setFontSize([numValue]);
    }
  }, []);

  const handleFontSizeSliderChange = useCallback((value: number[]) => {
    setFontSize(value);
    setFontSizeInput(value[0].toString());
  }, []);

  const handleExport = useCallback(() => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'text-behind-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    
    toast.success("Image exported successfully!");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl shadow-glow">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Text Behind Image</h1>
                <p className="text-sm text-muted-foreground">AI-powered depth layering for stunning visuals</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExport}
                disabled={!image}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Controls Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-card border-border shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Processing Mode</h3>
              </div>
              
              <div className="space-y-3">
                <Select value={processingMode} onValueChange={(value: "ai" | "advanced") => setProcessingMode(value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Detection</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span>Advanced Processing</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {processingMode === "ai" 
                    ? "Uses AI to detect subjects and place text behind them"
                    : "Enhanced text effects with multiple layers and depth"
                  }
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Type className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Text Controls</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="text-input" className="text-sm text-muted-foreground">Your Text</Label>
                  <Input
                    id="text-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter your text..."
                    className="bg-input border-border"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Font Size</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={fontSizeInput}
                      onChange={(e) => handleFontSizeInputChange(e.target.value)}
                      min={8}
                      max={200}
                      className="w-20 bg-input border-border"
                    />
                    <span className="flex items-center text-xs text-muted-foreground">px</span>
                  </div>
                  <Slider
                    value={fontSize}
                    onValueChange={handleFontSizeSliderChange}
                    max={200}
                    min={8}
                    step={2}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Text Style</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={textBold ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTextBold(!textBold)}
                      className="p-2"
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={textItalic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTextItalic(!textItalic)}
                      className="p-2"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={textUnderline ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTextUnderline(!textUnderline)}
                      className="p-2"
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Text Color</Label>
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 bg-input border-border"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Opacity: {textOpacity[0]}%</Label>
                  <Slider
                    value={textOpacity}
                    onValueChange={setTextOpacity}
                    max={100}
                    min={10}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Position & Effects</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Horizontal Position: {textX[0]}%</Label>
                  <Slider
                    value={textX}
                    onValueChange={setTextX}
                    max={100}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Vertical Position: {textY[0]}%</Label>
                  <Slider
                    value={textY}
                    onValueChange={setTextY}
                    max={100}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Depth Blur: {blurStrength[0]}px</Label>
                  <Slider
                    value={blurStrength}
                    onValueChange={setBlurStrength}
                    max={10}
                    min={0}
                    step={0.5}
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-3">
            <Card className="p-6 bg-card border-border shadow-float">
              {!image ? (
                <div
                  className={`
                    border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
                    ${isDragging 
                      ? 'border-primary bg-primary/5 scale-105' 
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-gradient-primary rounded-full shadow-glow animate-glow">
                        <Upload className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          Drop your image here
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          AI will detect the subject and place text intelligently behind it
                        </p>
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="border-border hover:bg-surface-elevated"
                        >
                          Choose Image
                        </Button>
                      </div>
                    </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="relative bg-surface-elevated rounded-xl p-4 shadow-soft">
                      <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-[600px] rounded-lg shadow-soft"
                        style={{ objectFit: 'contain' }}
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <div className="text-center animate-fade-in max-w-sm mx-auto p-6">
                            {/* Step-specific icon */}
                            <div className="mb-4 flex justify-center">
                              {processingStep === "loading" && (
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                              )}
                              {processingStep === "processing" && (
                                <div className="relative">
                                  <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                                  <div className="absolute inset-0 w-12 h-12 border-2 border-primary/30 rounded-full animate-ping"></div>
                                </div>
                              )}
                              {processingStep === "converting" && (
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                              )}
                              {processingStep === "complete" && (
                                <CheckCircle className="w-12 h-12 text-green-500 animate-pulse" />
                              )}
                              {processingStep === "error" && (
                                <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
                              )}
                            </div>
                            
                            {/* Status message */}
                            <p className="text-foreground font-medium mb-3 text-lg">{statusMessage}</p>
                            
                            {/* Progress bar */}
                            <div className="w-full mb-3">
                              <Progress 
                                value={processingProgress} 
                                className="w-full h-2"
                              />
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {processingProgress}% complete
                                </p>
                                {processingStartTime > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {((Date.now() - processingStartTime) / 1000).toFixed(1)}s
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Step-specific additional info */}
                            <p className="text-muted-foreground text-sm mb-4">
                              {processingStep === "loading" && "Preparing your image..."}
                              {processingStep === "processing" && "AI is analyzing the image structure"}
                              {processingStep === "converting" && "Optimizing results for text placement"}
                              {processingStep === "complete" && "Processing completed successfully!"}
                              {processingStep === "error" && "Something went wrong. You can try again or use a different image."}
                            </p>
                            
                            {/* Retry button for error state */}
                            {processingStep === "error" && image && (
                              <div className="flex gap-2 justify-center">
                                <Button
                                  onClick={() => {
                                    // Convert HTMLImageElement back to File-like object for retry
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    if (ctx && image) {
                                      canvas.width = image.naturalWidth;
                                      canvas.height = image.naturalHeight;
                                      ctx.drawImage(image, 0, 0);
                                      canvas.toBlob((blob) => {
                                        if (blob) {
                                          const file = new File([blob], 'retry-image.png', { type: 'image/png' });
                                          processImageFile(file);
                                        }
                                      });
                                    }
                                  }}
                                  size="sm"
                                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                  <Loader2 className="w-4 h-4 mr-2" />
                                  Retry Processing
                                </Button>
                                <Button
                                  onClick={() => fileInputRef.current?.click()}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Choose Different Image
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="border-border hover:bg-surface-elevated"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      New Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Status Bar */}
      {statusMessage && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status indicator */}
                {processingStep === "loading" && (
                  <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                {processingStep === "processing" && (
                  <div className="animate-pulse w-2 h-2 bg-primary rounded-full"></div>
                )}
                {processingStep === "converting" && (
                  <div className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
                {processingStep === "complete" && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
                {processingStep === "error" && (
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                )}
                
                <span className="text-sm text-muted-foreground">{statusMessage}</span>
              </div>
              
              {/* Progress indicator in status bar */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{processingProgress}%</span>
                  <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};