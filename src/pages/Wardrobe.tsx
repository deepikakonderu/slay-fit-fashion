import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shirt, Plus, Edit2, Trash2, Scan, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useToast } from "@/hooks/use-toast";
import { isGeminiConfigured, fileToGenerativePart } from "@/lib/gemini";
import { analyzeClothingImage } from "@/services/ai/clothingAnalysis";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES, COLORS, STYLES, PATTERNS, SEASONS, OCCASIONS, GENDERS } from "@/lib/constants";
import { WardrobeItem } from "@/types";

const Wardrobe = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, isLoading, updateItem, deleteItem } = useWardrobe();

  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [analyzingItem, setAnalyzingItem] = useState<string | null>(null);
  const [activeGender, setActiveGender] = useState("All");

  const filteredItems = items.filter((item) => {
    if (activeGender === "All") return true;
    if (activeGender === "Unknown") return !item.gender;
    return item.gender?.toLowerCase() === activeGender.toLowerCase();
  });

  const getGenderStats = () => {
    return {
      All: items.length,
      Male: items.filter(item => item.gender?.toLowerCase() === "male").length,
      Female: items.filter(item => item.gender?.toLowerCase() === "female").length,
      Unisex: items.filter(item => item.gender?.toLowerCase() === "unisex").length,
      Kids: items.filter(item => item.gender?.toLowerCase() === "kids").length,
      Unknown: items.filter(item => !item.gender).length,
    };
  };

  const stats = getGenderStats();

  const handleAnalyzeWithAI = async (item: WardrobeItem) => {
    if (!isGeminiConfigured()) {
      toast({
        title: "AI Not Configured",
        description: "Add VITE_GEMINI_API_KEY to your .env file to enable AI auto-tagging.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzingItem(item.id);
    try {
      // Fetch image blob via Supabase storage bypass to avoid CORS
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('wardrobe-images')
        .download(item.file_path || '');

      if (downloadError) throw downloadError;

      // Read as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base = (reader.result as string).split(",")[1];
          resolve(base);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(fileData);
      const base64 = await base64Promise;

      // Analyze
      const analysis = await analyzeClothingImage(base64, fileData.type);

      // Save analysis results back to the item
      await updateItem({
        id: item.id,
        updates: {
          color: analysis.color || item.color,
          category: analysis.category || item.category,
          style: analysis.style || item.style,
          pattern: analysis.pattern || item.pattern,
          season: analysis.season || item.season,
          brand: analysis.brand || item.brand,
          fabric: analysis.fabric || item.fabric,
          occasion: analysis.occasion || item.occasion,
          gender: analysis.gender || item.gender,
          name: analysis.name || item.name,
          ai_description: analysis.description || item.ai_description,
        }
      });

      toast({
        title: "AI Analysis Complete",
        description: "Item attributes have been successfully auto-tagged.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "AI Analysis Failed",
        description: error.message || "Failed to analyze wardrobe item.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingItem(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateItem({
        id: editingItem.id,
        updates: {
          name: editingItem.name,
          category: editingItem.category,
          color: editingItem.color,
          style: editingItem.style,
          pattern: editingItem.pattern,
          season: editingItem.season,
          brand: editingItem.brand,
          fabric: editingItem.fabric,
          occasion: editingItem.occasion,
          gender: editingItem.gender,
        }
      });
      setEditingItem(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (item: WardrobeItem) => {
    try {
      await deleteItem({ id: item.id, imageUrl: item.image_url });
    } catch (error) {
      console.error(error);
    }
  };

  const getBadgeColor = (key: string | null) => {
    if (!key) return "bg-muted text-muted-foreground";
    return "bg-secondary text-secondary-foreground";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-4 bg-background">
      <Navigation />
      
      <main className="container max-w-7xl mx-auto px-4 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">My Wardrobe</h1>
            <p className="text-muted-foreground mt-1">{items.length} items in your digital closet.</p>
          </div>
          <Button onClick={() => navigate("/upload")} className="rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Gender Filter Tabs */}
        <Tabs value={activeGender} onValueChange={setActiveGender} className="mb-8">
          <TabsList className="grid grid-cols-6 max-w-2xl">
            <TabsTrigger value="All" className="py-2">
              All ({stats.All})
            </TabsTrigger>
            <TabsTrigger value="Male" className="py-2">
              Male ({stats.Male})
            </TabsTrigger>
            <TabsTrigger value="Female" className="py-2">
              Female ({stats.Female})
            </TabsTrigger>
            <TabsTrigger value="Unisex" className="py-2">
              Unisex ({stats.Unisex})
            </TabsTrigger>
            <TabsTrigger value="Kids" className="py-2">
              Kids ({stats.Kids})
            </TabsTrigger>
            <TabsTrigger value="Unknown" className="py-2">
              Unknown ({stats.Unknown})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-muted-foreground/20 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Shirt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No clothing items found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {activeGender === "All" 
                ? "Start uploading your fashion pieces to unlock styling features."
                : `No items found matching the ${activeGender} category.`}
            </p>
            <Button onClick={() => navigate("/upload")}>Upload Item</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all border-primary/10">
                <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                  <img src={item.image_url} alt={item.name || item.category} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                  
                  {/* Overlay buttons */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleAnalyzeWithAI(item)} disabled={analyzingItem === item.id}>
                      {analyzingItem === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><Scan className="w-4 h-4 mr-2" /> AI Analyze</>
                      )}
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="icon" onClick={() => setEditingItem(item)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Item Attributes</DialogTitle>
                        </DialogHeader>
                        {editingItem && (
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Item Name</Label>
                              <Input value={editingItem.name || ""} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={editingItem.category} onValueChange={v => setEditingItem({...editingItem, category: v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Color</Label>
                                <Select value={editingItem.color || "None"} onValueChange={v => setEditingItem({...editingItem, color: v === "None" ? null : v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    {COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Style</Label>
                                <Select value={editingItem.style || "None"} onValueChange={v => setEditingItem({...editingItem, style: v === "None" ? null : v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    {STYLES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Occasion</Label>
                                <Select value={editingItem.occasion || "None"} onValueChange={v => setEditingItem({...editingItem, occasion: v === "None" ? null : v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    {OCCASIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Pattern</Label>
                                <Select value={editingItem.pattern || "None"} onValueChange={v => setEditingItem({...editingItem, pattern: v === "None" ? null : v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    {PATTERNS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Season</Label>
                                <Select value={editingItem.season || "None"} onValueChange={v => setEditingItem({...editingItem, season: v === "None" ? null : v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    {SEASONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select value={editingItem.gender || "None"} onValueChange={v => setEditingItem({...editingItem, gender: v === "None" ? null : v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    {GENDERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Brand</Label>
                                <Input value={editingItem.brand || ""} onChange={e => setEditingItem({...editingItem, brand: e.target.value})} placeholder="e.g. Levi's" />
                              </div>
                            </div>

                            <Button onClick={handleSaveEdit} className="w-full mt-4">Save Changes</Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button variant="destructive" size="icon" onClick={() => handleDelete(item)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1 capitalize">{item.name || item.category}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                  </div>

                  {item.ai_description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 italic">"{item.ai_description}"</p>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.color && <Badge variant="secondary" className="text-[10px] py-0 px-2 capitalize">{item.color}</Badge>}
                    {item.style && <Badge variant="secondary" className="text-[10px] py-0 px-2 capitalize">{item.style}</Badge>}
                    {item.season && <Badge variant="secondary" className="text-[10px] py-0 px-2 capitalize">{item.season}</Badge>}
                    {item.fabric && <Badge variant="secondary" className="text-[10px] py-0 px-2 capitalize">{item.fabric}</Badge>}
                    {item.brand && <Badge variant="outline" className="text-[10px] py-0 px-2 capitalize">{item.brand}</Badge>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wardrobe;