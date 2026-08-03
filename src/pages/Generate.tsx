import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";
import { generateOutfitWithAI } from "@/services/ai/outfitGenerator";
import { GeneratedOutfit, WardrobeItem } from "@/types";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OCCASIONS, STYLES, GENDERS } from "@/lib/constants";
import { Loader2, Wand2, Heart, RefreshCw, Bookmark } from "lucide-react";

const Generate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { items: wardrobeItems, isLoading: isWardrobeLoading } = useWardrobe();
  const { saveOutfit, isSaving } = useSavedOutfits();

  const [preferences, setPreferences] = useState({
    occasion: "Everyday",
    style: "Casual",
    gender: "Unisex",
    weather: "Sunny",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<GeneratedOutfit | null>(null);

  const handleGenerate = async () => {
    if (!user) {
      toast({ title: "Error", description: "Please log in to use AI styling.", variant: "destructive" });
      return;
    }
    
    if (!wardrobeItems || wardrobeItems.length < 2) {
      toast({ title: "Not enough items", description: "Please add at least 2 items to your wardrobe first.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setCurrentOutfit(null);

    try {
      const outfit = await generateOutfitWithAI(wardrobeItems, preferences);
      setCurrentOutfit(outfit);
      toast({ title: "Outfit Generated!", description: "The AI Stylist has curated a look for you." });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOutfit = async () => {
    if (!currentOutfit || !user) return;
    
    try {
      const itemsPayload = {
        top: currentOutfit.top || null,
        bottom: currentOutfit.bottom || null,
        one_piece: currentOutfit.one_piece || null,
        shoes: currentOutfit.shoes || null,
        accessories: currentOutfit.accessories || [],
      };

      await saveOutfit({
        name: `${preferences.style} ${preferences.occasion} Look`,
        description: currentOutfit.styleNotes,
        occasion: preferences.occasion,
        style: preferences.style,
        gender: preferences.gender,
        ai_score: currentOutfit.aiScore,
        items: itemsPayload as any,
      });

    } catch (error) {
      console.error(error);
    }
  };

  const ItemCard = ({ item, title }: { item: WardrobeItem; title: string }) => (
    <Card className="p-4 flex flex-col items-center gap-3 bg-secondary/20 border-primary/10">
      <h3 className="font-medium text-sm text-muted-foreground w-full text-left">{title}</h3>
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-background">
        <img src={item.image_url} alt={item.name || item.category} className="w-full h-full object-cover" />
      </div>
      <div className="text-center">
        <p className="font-semibold line-clamp-1">{item.name || item.category}</p>
        <p className="text-xs text-muted-foreground capitalize">{item.color} • {item.style}</p>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen pb-20 md:pb-4 bg-background">
      <Navigation />
      
      <main className="container max-w-6xl mx-auto px-4 pt-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Stylist</h1>
            <p className="text-muted-foreground mt-1">Let our Gemini AI generate the perfect outfit for you.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Left Column: Preferences Form */}
          <div className="md:col-span-4 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Style Preferences
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Occasion</label>
                  <Select value={preferences.occasion} onValueChange={(v) => setPreferences({...preferences, occasion: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{OCCASIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Style</label>
                  <Select value={preferences.style} onValueChange={(v) => setPreferences({...preferences, style: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weather</label>
                  <Select value={preferences.weather} onValueChange={(v) => setPreferences({...preferences, weather: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Hot & Sunny', 'Warm', 'Breezy', 'Cold', 'Raining', 'Snowing'].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Gender</label>
                  <Select value={preferences.gender} onValueChange={(v) => setPreferences({...preferences, gender: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full mt-4" 
                  size="lg"
                  onClick={handleGenerate} 
                  disabled={isGenerating || isWardrobeLoading}
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><SparklesIcon /> Generate Outfit</>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Generation Result */}
          <div className="md:col-span-8">
            <Card className="p-8 min-h-[500px] flex flex-col justify-center bg-gradient-to-br from-background to-secondary/10 border-primary/20">
              {!currentOutfit && !isGenerating && (
                <div className="text-center space-y-4 max-w-md mx-auto">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wand2 className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">Ready to style</h3>
                  <p className="text-muted-foreground">Select your preferences on the left and let Gemini AI craft the perfect combination from your wardrobe.</p>
                </div>
              )}

              {isGenerating && (
                <div className="text-center space-y-6">
                  <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
                  <p className="text-lg font-medium animate-pulse">Analyzing your wardrobe aesthetics...</p>
                </div>
              )}

              {currentOutfit && !isGenerating && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        {currentOutfit.aiScore}% Match
                      </h2>
                      <p className="text-muted-foreground mt-2 max-w-xl leading-relaxed">{currentOutfit.styleNotes}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={handleGenerate}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button onClick={handleSaveOutfit} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bookmark className="w-4 h-4 mr-2" /> Save</>}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentOutfit.one_piece ? (
                       <div className="col-span-2"><ItemCard item={currentOutfit.one_piece} title="One Piece" /></div>
                    ) : (
                      <>
                        {currentOutfit.top && <ItemCard item={currentOutfit.top} title="Top" />}
                        {currentOutfit.bottom && <ItemCard item={currentOutfit.bottom} title="Bottom" />}
                      </>
                    )}
                    {currentOutfit.shoes && <ItemCard item={currentOutfit.shoes} title="Shoes" />}
                    {currentOutfit.accessories.map((acc, i) => (
                       <ItemCard key={acc.id} item={acc} title={`Accessory ${i+1}`} />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};

const SparklesIcon = () => <Wand2 className="w-4 h-4 mr-2" />;

export default Generate;