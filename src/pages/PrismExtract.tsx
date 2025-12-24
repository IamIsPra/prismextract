import { Check, Copy, Image as ImageIcon, Palette, Sparkles, Upload, Wand2 } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  const [copied, setCopied] = useState(false);
  const [colorCount, setColorCount] = useState<number>(6);
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
      const extractedColors = await extractColors(file, colorCount);
      setColors(extractedColors);
      
      toast({
        title: 'Success!',
        description: `Extracted ${extractedColors.length} dominant colors from your image`
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
    if (file) {
      handleFileChange(file);
    }
  };

  // Handle upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Toggle color selection
  const toggleColor = (colorId: string) => {
    setSelectedColors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(colorId)) {
        if (newSet.size > 1) {
          newSet.delete(colorId);
        }
      } else {
        newSet.add(colorId);
      }
      return newSet;
    });
  };

  // Update stop position
  const updateStop = (index: number, value: number) => {
    setStops(prev => {
      const newStops = [...prev];
      newStops[index] = value;
      return newStops;
    });
  };

  // Handle preview click to adjust angle
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    let newAngle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (newAngle < 0) newAngle += 360;
    
    setAngle(Math.round(newAngle));
  };

  // Copy CSS to clipboard
  const handleCopyCSS = () => {
    navigator.clipboard.writeText(`background: ${gradientCSS};`);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'CSS code copied to clipboard'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset everything
  const handleReset = () => {
    setColors([]);
    setSelectedColors(new Set());
    setStops([]);
    setUploadedImage(null);
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Modern Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/70 rounded-3xl soft-shadow">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Prism-Extract
            </h1>
          </div>
          <p className="text-center text-muted-foreground text-lg">
            Extract colors from images and create beautiful CSS gradients
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {/* Left Column: Upload & Palette */}
          <div className="space-y-8">
            {/* Upload Area */}
            <Card className="border-0 soft-shadow-lg rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-2xl">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Upload Image</h2>
                </div>

                {/* Color Count Selector */}
                <div className="mb-6 space-y-3">
                  <Label className="text-sm font-medium">Number of Colors to Extract</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[colorCount]}
                      onValueChange={(value) => setColorCount(value[0])}
                      min={3}
                      max={12}
                      step={1}
                      className="flex-1"
                    />
                    <div className="w-16 text-center">
                      <Input
                        type="number"
                        value={colorCount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= 3 && val <= 12) {
                            setColorCount(val);
                          }
                        }}
                        min={3}
                        max={12}
                        className="text-center rounded-xl"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose between 3 and 12 colors
                  </p>
                </div>
                
                <div
                  className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 cursor-pointer ${
                    isDragging
                      ? 'border-primary bg-primary/5 scale-[0.98]'
                      : 'border-border hover:border-primary/50 hover:bg-accent/30'
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
                    <div className="relative group">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="w-full h-64 object-cover rounded-2xl"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="lg"
                          className="rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                          }}
                        >
                          Change Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="p-6 bg-primary/10 rounded-full mb-6">
                        <Upload className="w-12 h-12 text-primary" />
                      </div>
                      <p className="text-lg text-foreground font-semibold mb-2">
                        {isProcessing ? 'Processing...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports JPG, PNG, GIF, and WebP formats
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Color Palette */}
            {colors.length > 0 && (
              <Card className="border-0 soft-shadow-lg rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-2xl">
                      <Palette className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Extracted Colors</h2>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {colors.map((color) => {
                      const isSelected = selectedColors.has(color.id);
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => toggleColor(color.id)}
                          className={`group relative aspect-square rounded-2xl transition-all duration-300 ${
                            isSelected 
                              ? 'scale-100 soft-shadow' 
                              : 'scale-95 opacity-50 hover:opacity-75'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          <div className="absolute inset-0 rounded-2xl border-4 border-white/20" />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="p-2 bg-white/90 rounded-full">
                                <Check className="w-5 h-5 text-primary" />
                              </div>
                            </div>
                          )}
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="text-xs font-mono rounded-full">
                              {color.hex}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Gradient Preview & Controls */}
          <div className="space-y-8">
            {/* Gradient Preview */}
            {colors.length > 0 && (
              <Card className="border-0 soft-shadow-lg rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-2xl">
                      <Wand2 className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Gradient Preview</h2>
                  </div>
                  
                  <div
                    ref={previewRef}
                    className="w-full h-80 rounded-3xl soft-shadow-lg cursor-pointer transition-transform hover:scale-[0.98] relative overflow-hidden"
                    style={{ background: gradientCSS }}
                    onClick={handlePreviewClick}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4">
                        <p className="text-white/90 text-sm font-medium">Click to adjust angle</p>
                        <p className="text-white/70 text-xs mt-1">Current angle: {angle}°</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Controls */}
            {colors.length > 0 && (
              <Card className="border-0 soft-shadow-lg rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-muted/50">
                      <TabsTrigger value="basic" className="rounded-xl">Basic</TabsTrigger>
                      <TabsTrigger value="advanced" className="rounded-xl">Advanced</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-6 mt-6">
                      <div className="space-y-3">
                        <Label className="text-base font-medium">Angle</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[angle]}
                            onValueChange={(value) => setAngle(value[0])}
                            min={0}
                            max={360}
                            step={1}
                            className="flex-1"
                          />
                          <div className="w-20">
                            <Input
                              type="number"
                              value={angle}
                              onChange={(e) => setAngle(Number(e.target.value))}
                              min={0}
                              max={360}
                              className="text-center rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-6 mt-6">
                      <div className="space-y-6">
                        {colors.map((color, index) => {
                          const isSelected = selectedColors.has(color.id);
                          if (!isSelected) return null;
                          
                          return (
                            <div key={color.id} className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-xl soft-shadow"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <Label className="text-sm font-medium">{color.hex}</Label>
                              </div>
                              <div className="flex items-center gap-4">
                                <Slider
                                  value={[stops[index] || 0]}
                                  onValueChange={(value) => updateStop(index, value[0])}
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="flex-1"
                                />
                                <div className="w-16 text-sm text-muted-foreground font-medium">
                                  {stops[index] || 0}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* CSS Output */}
            {colors.length > 0 && (
              <Card className="border-0 soft-shadow-lg rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-2xl">
                        <Copy className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold">CSS Code</h2>
                    </div>
                    <Button
                      onClick={handleCopyCSS}
                      className="rounded-full"
                      size="lg"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="bg-muted/50 rounded-2xl p-6 font-mono text-sm overflow-x-auto">
                    <code className="text-foreground">
                      background: {gradientCSS};
                    </code>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
