import { Copy, Palette, RotateCw, Upload, X } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { type ColorInfo, extractColors, generateGradient } from '@/lib/colorExtractor';

export default function PrismExtract() {
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [angle, setAngle] = useState<number>(90);
  const [stops, setStops] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize stops when colors change
  React.useEffect(() => {
    if (colors.length > 0) {
      const newStops = colors.map((_, index) => 
        Math.round((index / (colors.length - 1)) * 100)
      );
      setStops(newStops);
      setSelectedColors(new Set(colors.map(c => c.id)));
    }
  }, [colors]);

  // Generate gradient CSS
  const gradientCSS = useMemo(() => {
    const activeColors = colors.filter(c => selectedColors.has(c.id));
    if (activeColors.length === 0) return '';
    
    const activeStops = activeColors.map((color, index) => {
      const originalIndex = colors.findIndex(c => c.id === color.id);
      return stops[originalIndex] || 0;
    });
    
    return generateGradient(activeColors, angle, activeStops);
  }, [colors, selectedColors, angle, stops]);

  // Handle file upload
  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (JPG, PNG, GIF, or WebP)',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Extract colors
      const extractedColors = await extractColors(file, 6);
      setColors(extractedColors);
      
      toast({
        title: 'Success!',
        description: `Extracted ${extractedColors.length} colors from your image`
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to extract colors from the image',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  // Handle click to upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Toggle color selection
  const toggleColor = (colorId: string) => {
    const newSelected = new Set(selectedColors);
    if (newSelected.has(colorId)) {
      if (newSelected.size > 1) {
        newSelected.delete(colorId);
      }
    } else {
      newSelected.add(colorId);
    }
    setSelectedColors(newSelected);
  };

  // Copy gradient CSS to clipboard
  const copyToClipboard = async () => {
    if (!gradientCSS) return;
    
    try {
      await navigator.clipboard.writeText(`background: ${gradientCSS};`);
      toast({
        title: 'Copied!',
        description: 'Gradient CSS copied to clipboard'
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  // Handle preview click for angle adjustment
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    let newAngle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (newAngle < 0) newAngle += 360;
    
    setAngle(Math.round(newAngle));
  };

  // Reset all
  const handleReset = () => {
    setColors([]);
    setSelectedColors(new Set());
    setAngle(90);
    setStops([]);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <Palette className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Prism-Extract</h1>
          </div>
          <p className="text-center text-muted-foreground mt-2">
            Extract colors from images and create beautiful CSS gradients
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column: Upload & Palette */}
          <div className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Image</CardTitle>
                <CardDescription>
                  Drag and drop or click to select an image (JPG, PNG, GIF, WebP)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary hover:bg-accent/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleUploadClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                  
                  {uploadedImage ? (
                    <div className="relative">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-foreground font-medium mb-1">
                        {isProcessing ? 'Processing...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports JPG, PNG, GIF, and WebP
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Color Palette */}
            {colors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Colors</CardTitle>
                  <CardDescription>
                    Click to toggle colors in the gradient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => toggleColor(color.id)}
                        className={`group relative aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
                          selectedColors.has(color.id)
                            ? 'ring-4 ring-primary scale-105'
                            : 'ring-2 ring-border hover:ring-primary/50'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                          <Badge
                            variant="secondary"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {color.hex}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Preview & Controls */}
          <div className="space-y-6">
            {/* Gradient Preview */}
            {colors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gradient Preview</CardTitle>
                  <CardDescription>
                    Click on the preview to adjust the gradient angle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    ref={previewRef}
                    className="w-full h-64 rounded-lg shadow-lg cursor-crosshair transition-all duration-200"
                    style={{ background: gradientCSS }}
                    onClick={handlePreviewClick}
                  />
                </CardContent>
              </Card>
            )}

            {/* Controls */}
            {colors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gradient Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-6 mt-6">
                      {/* Angle Control */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Angle</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="360"
                              value={angle}
                              onChange={(e) => setAngle(Number(e.target.value))}
                              className="w-20 text-right"
                            />
                            <span className="text-sm text-muted-foreground">°</span>
                          </div>
                        </div>
                        <Slider
                          value={[angle]}
                          onValueChange={(value) => setAngle(value[0])}
                          min={0}
                          max={360}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-4 mt-6">
                      <Accordion type="single" collapsible className="w-full">
                        {colors.filter(c => selectedColors.has(c.id)).map((color, index) => (
                          <AccordionItem key={color.id} value={color.id}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-6 h-6 rounded border-2 border-border"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span className="font-mono text-sm">{color.hex}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Position</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={stops[colors.indexOf(color)] || 0}
                                      onChange={(e) => {
                                        const newStops = [...stops];
                                        newStops[colors.indexOf(color)] = Number(e.target.value);
                                        setStops(newStops);
                                      }}
                                      className="w-20 text-right"
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                  </div>
                                </div>
                                <Slider
                                  value={[stops[colors.indexOf(color)] || 0]}
                                  onValueChange={(value) => {
                                    const newStops = [...stops];
                                    newStops[colors.indexOf(color)] = value[0];
                                    setStops(newStops);
                                  }}
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="w-full"
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* CSS Output */}
            {colors.length > 0 && gradientCSS && (
              <Card>
                <CardHeader>
                  <CardTitle>CSS Code</CardTitle>
                  <CardDescription>
                    Copy and paste into your stylesheet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      <code>background: {gradientCSS};</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={copyToClipboard}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reset Button */}
            {colors.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleReset}
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Prism-Extract. All processing happens in your browser - your images never leave your device.</p>
        </div>
      </footer>
    </div>
  );
}
