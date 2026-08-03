import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Heart, Shirt, Trash2, Calendar, Sparkles, Loader2 } from "lucide-react";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Saved = () => {
  const { outfits, isLoading, deleteOutfit } = useSavedOutfits();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);

  const handleDeleteOutfit = async () => {
    if (!outfitToDelete) return;
    try {
      await deleteOutfit(outfitToDelete);
      setDeleteDialogOpen(false);
      setOutfitToDelete(null);
    } catch (error) {
      console.error("Error deleting outfit:", error);
    }
  };

  const openDeleteDialog = (outfitId: string) => {
    setOutfitToDelete(outfitId);
    setDeleteDialogOpen(true);
  };

  const getGenderColor = (gender: string | null) => {
    if (!gender) return "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300";
    switch (gender.toLowerCase()) {
      case 'kids':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300';
      case 'male':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300';
      case 'female':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300';
      default:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-4 bg-background">
        <Navigation />
        <main className="container max-w-7xl mx-auto px-4 pt-24">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 rounded-3xl min-h-[300px]" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-4 bg-background">
      <Navigation />
      
      <main className="container max-w-7xl mx-auto px-4 pt-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Saved Outfits</h1>
            <p className="text-muted-foreground mt-1 text-lg">Your curated, favorite style combinations.</p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/generate">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Outfit
            </Link>
          </Button>
        </div>

        {outfits.length === 0 ? (
          <Card className="p-12 text-center rounded-3xl border-dashed border-2 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No saved outfits yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Use Slay AI Stylist to generate outfits and save your favorites here.
            </p>
            <Button asChild>
              <Link to="/generate">Curate Look</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map((outfit) => {
              const outfitItems = outfit.items as any;
              return (
                <Card key={outfit.id} className="p-6 rounded-3xl group relative hover:shadow-lg transition-all border-primary/10 flex flex-col justify-between">
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground z-10"
                      onClick={() => openDeleteDialog(outfit.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    {/* Outfit Preview Grid */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl mb-4 p-4 flex items-center justify-center">
                      <div className="grid grid-cols-2 gap-2 w-full h-full">
                        {outfitItems?.one_piece ? (
                          <div className="col-span-2 bg-background/50 rounded-lg flex flex-col items-center justify-center p-2">
                            <img src={outfitItems.one_piece.image_url} alt="One Piece" className="w-16 h-16 object-cover rounded" />
                            <span className="text-[10px] text-muted-foreground mt-1">One Piece</span>
                          </div>
                        ) : (
                          <>
                            <div className="bg-background/50 rounded-lg flex flex-col items-center justify-center p-2">
                              {outfitItems?.top?.image_url ? (
                                <img src={outfitItems.top.image_url} alt="Top" className="w-12 h-12 object-cover rounded" />
                              ) : (
                                <Shirt className="w-6 h-6 text-muted-foreground/45" />
                              )}
                              <span className="text-[10px] text-muted-foreground mt-1">Top</span>
                            </div>

                            <div className="bg-background/50 rounded-lg flex flex-col items-center justify-center p-2">
                              {outfitItems?.bottom?.image_url ? (
                                <img src={outfitItems.bottom.image_url} alt="Bottom" className="w-12 h-12 object-cover rounded" />
                              ) : (
                                <Shirt className="w-6 h-6 text-muted-foreground/45" />
                              )}
                              <span className="text-[10px] text-muted-foreground mt-1">Bottom</span>
                            </div>
                          </>
                        )}

                        <div className="bg-background/50 rounded-lg flex flex-col items-center justify-center p-2">
                          {outfitItems?.shoes?.image_url ? (
                            <img src={outfitItems.shoes.image_url} alt="Shoes" className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <Shirt className="w-6 h-6 text-muted-foreground/45" />
                          )}
                          <span className="text-[10px] text-muted-foreground mt-1">Shoes</span>
                        </div>

                        <div className="bg-background/50 rounded-lg flex flex-col items-center justify-center p-2">
                          {outfitItems?.accessories?.[0]?.image_url ? (
                            <img src={outfitItems.accessories[0].image_url} alt="Accessory" className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <Shirt className="w-6 h-6 text-muted-foreground/45" />
                          )}
                          <span className="text-[10px] text-muted-foreground mt-1">Accessory</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg pr-8 line-clamp-1">{outfit.name}</h3>
                        <Badge className={`rounded-full text-[10px] uppercase ${getGenderColor(outfit.gender)}`}>
                          {outfit.gender || "Unisex"}
                        </Badge>
                      </div>
                      
                      {outfit.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {outfit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 mt-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(outfit.created_at).toLocaleDateString()}</span>
                      </div>
                      {outfit.ai_score && (
                        <span className={`font-semibold ${getScoreColor(outfit.ai_score)}`}>
                          AI Score: {outfit.ai_score}%
                        </span>
                      )}
                    </div>
                    {outfit.occasion && (
                      <Badge variant="outline" className="rounded-full text-[10px] capitalize">
                        {outfit.occasion}
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Saved Outfit?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the saved outfit combination.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteOutfit}
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Outfit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Saved;