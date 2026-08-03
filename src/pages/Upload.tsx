import React, { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWardrobe } from "@/hooks/useWardrobe";
import { analyzeClothingImage } from "@/services/ai/clothingAnalysis";
import { fileToGenerativePart, isGeminiConfigured } from "@/lib/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload as UploadIcon, Loader2, Sparkles, X, Check, AlertCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { CATEGORIES, COLORS, STYLES, PATTERNS, SEASONS, OCCASIONS, GENDERS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { AIAnalysisResult } from "@/types";
import { compressImage } from "@/utils/imageCompressor";

const Upload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addItem } = useWardrobe();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [useAi, setUseAi] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    color: "",
    style: "",
    pattern: "",
    season: "",
    brand: "",
    fabric: "",
    occasion: "",
    gender: "",
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setAiAnalysis(null);
    setFormData(prev => ({ ...prev, name: selectedFile.name.replace(/\.[^/.]+$/, "") }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setAiAnalysis(null);
      setFormData(prev => ({ ...prev, name: droppedFile.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  const runAiAnalysis = async () => {
    if (!file) return;

    if (!isGeminiConfigured()) {
      toast({
        title: "AI Not Configured",
        description: "Add VITE_GEMINI_API_KEY to your .env file to enable AI analysis. You can still add items manually.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { inlineData } = await fileToGenerativePart(file);
      const analysis = await analyzeClothingImage(inlineData.data, inlineData.mimeType);
      setAiAnalysis(analysis);
      
      if (useAi) {
        setFormData({
          name: analysis.name || formData.name,
          category: analysis.category || "",
          color: analysis.color || "",
          style: analysis.style || "",
          pattern: analysis.pattern || "",
          season: analysis.season || "",
          brand: analysis.brand || "",
          fabric: analysis.fabric || "",
          occasion: analysis.occasion || "",
          gender: analysis.gender || "",
        });
      }
      toast({ title: "AI Analysis Complete", description: "Attributes have been extracted." });
    } catch (error: any) {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    if (!formData.category) {
      toast({ title: "Category Required", description: "Please select a category for your item.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // Compress the image before uploading (default limits to 1024x1024)
      const compressedFile = await compressImage(file);

      // 1. Upload Image to Supabase Storage
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(fileName);

      // 2. Save Item to Database via Hook
      await addItem({
        image_url: publicUrl,
        file_path: fileName,
        name: formData.name,
        category: formData.category,
        color: formData.color || null,
        style: formData.style || null,
        pattern: formData.pattern || null,
        season: formData.season || null,
        brand: formData.brand || null,
        fabric: formData.fabric || null,
        occasion: formData.occasion || null,
        gender: formData.gender || null,
        ai_description: aiAnalysis?.description || null,
        description: null,
        is_favorite: false,
      });

      toast({ title: "Item Added!", description: "Your item has been added to your wardrobe." });

      // Reset
      setFile(null);
      setPreview("");
      setAiAnalysis(null);
      setFormData({
        name: "", category: "", color: "", style: "", pattern: "", season: "", brand: "", fabric: "", occasion: "", gender: ""
      });

    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const geminiAvailable = isGeminiConfigured();

  return (
    <div className="min-h-screen pb-20 md:pb-4 bg-background">
      <Navigation />
      
      <main className="container max-w-5xl mx-auto px-4 pt-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add to Wardrobe</h1>
            <p className="text-muted-foreground mt-1">Upload a new item and let AI tag it for you.</p>
          </div>
        </div>

        {!geminiAvailable && (
          <Card className="p-4 mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">AI Features Disabled</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Add <code className="bg-amber-200/50 dark:bg-amber-800/50 px-1 rounded">VITE_GEMINI_API_KEY</code> to your .env file to enable AI analysis. You can still add items manually.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Image Upload & AI */}
          <div className="space-y-6">
            <Card 
              className={`p-1 border-2 border-dashed transition-all duration-200 overflow-hidden ${
                preview ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="relative group rounded-xl overflow-hidden aspect-[4/5]">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Change
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { setFile(null); setPreview(""); setAiAnalysis(null); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center p-12 text-center aspect-[4/5] cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <UploadIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
                    Drag and drop your image here, or click to browse files
                  </p>
                  <Button variant="outline" size="sm">Select File</Button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Card>

            {preview && (
              <Card className={`p-4 ${geminiAvailable ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-muted'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${geminiAvailable ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">AI Stylist</h4>
                      <p className="text-xs text-muted-foreground">
                        {geminiAvailable ? 'Extract details automatically' : 'Configure API key to enable'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={runAiAnalysis}
                    disabled={isAnalyzing || !geminiAvailable}
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Analyze"}
                  </Button>
                </div>
                
                {aiAnalysis && (
                  <div className="mt-4 pt-4 border-t border-primary/10">
                    <p className="text-sm italic text-muted-foreground">{aiAnalysis.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <Label htmlFor="use-ai" className="text-sm font-medium">Auto-fill form with AI</Label>
                      <Switch id="use-ai" checked={useAi} onCheckedChange={setUseAi} />
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - Form */}
          <div>
            <Card className="p-6 h-full">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Classic Denim Jacket" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select value={formData.color} onValueChange={v => setFormData({ ...formData, color: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Style</Label>
                      <Select value={formData.style} onValueChange={v => setFormData({ ...formData, style: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{STYLES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Occasion</Label>
                      <Select value={formData.occasion} onValueChange={v => setFormData({ ...formData, occasion: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{OCCASIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pattern</Label>
                      <Select value={formData.pattern} onValueChange={v => setFormData({ ...formData, pattern: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{PATTERNS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Season</Label>
                      <Select value={formData.season} onValueChange={v => setFormData({ ...formData, season: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{SEASONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Gender Fit</Label>
                      <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>{GENDERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input id="brand" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Nike" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <Button type="submit" className="w-full" disabled={!file || !formData.category || isUploading}>
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Check className="w-4 h-4 mr-2" /> Save to Wardrobe</>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;