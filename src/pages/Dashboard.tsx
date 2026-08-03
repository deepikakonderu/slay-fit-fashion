import React, { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";
import { useEvents } from "@/hooks/useEvents";
import { useProfile } from "@/hooks/useProfile";
import { generateWardrobeInsights, WardrobeInsights } from "@/services/ai/wardrobeInsights";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Shirt, Bookmark, Calendar, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { items: wardrobe, isLoading: isWardrobeLoading } = useWardrobe();
  const { outfits, isLoading: isOutfitsLoading } = useSavedOutfits();
  const { events, isLoading: isEventsLoading } = useEvents();

  const [insights, setInsights] = useState<WardrobeInsights | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    if (wardrobe.length > 0 && !insights && !isGeneratingInsights && profile !== undefined) {
      const fetchInsights = async () => {
        setIsGeneratingInsights(true);
        try {
          const result = await generateWardrobeInsights(wardrobe, profile);
          setInsights(result);
        } catch (error) {
          console.error(error);
        } finally {
          setIsGeneratingInsights(false);
        }
      };
      fetchInsights();
    }
  }, [wardrobe, insights, isGeneratingInsights, profile]);

  const isLoading = isWardrobeLoading || isOutfitsLoading || isEventsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).slice(0, 3);

  return (
    <div className="min-h-screen pb-20 md:pb-4 bg-background">
      <Navigation />
      
      <main className="container max-w-6xl mx-auto px-4 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Stylist'}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Here's your fashion overview for today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shirt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">{wardrobe.length}</p>
              <p className="text-sm text-muted-foreground font-medium">Wardrobe Items</p>
            </div>
          </Card>
          
          <Card className="p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">{outfits.length}</p>
              <p className="text-sm text-muted-foreground font-medium">Saved Outfits</p>
            </div>
          </Card>

          <Card className="p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">{upcomingEvents.length}</p>
              <p className="text-sm text-muted-foreground font-medium">Upcoming Events</p>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Main Insights Panel */}
          <div className="md:col-span-8 space-y-8">
            <Card className="p-8 border-primary/20 bg-gradient-to-br from-background to-secondary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Sparkles className="w-48 h-48" />
              </div>
              
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                AI Wardrobe Analysis
              </h2>

              {isGeneratingInsights ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Gemini is analyzing your wardrobe...</p>
                </div>
              ) : insights ? (
                <div className="space-y-8 relative z-10">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-semibold text-lg">Fashion Score</span>
                      <span className="text-2xl font-bold text-primary">{insights.fashionScore}/100</span>
                    </div>
                    <Progress value={insights.fashionScore} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">{insights.scoreDescription}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Missing Essentials
                      </h3>
                      <ul className="space-y-2">
                        {insights.missingEssentials.map((item, i) => (
                          <li key={i} className="text-sm bg-muted/50 px-3 py-2 rounded-md">{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Recommendations
                      </h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {insights.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Upload items to your wardrobe to get AI insights.</p>
                  <Button asChild className="mt-4">
                    <Link to="/upload">Upload Items</Link>
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-4 space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center justify-between">
                Upcoming Events
                <Link to="/profile" className="text-xs text-primary hover:underline">View All</Link>
              </h3>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 border-b last:border-0 pb-3 last:pb-0">
                      <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-center min-w-[60px]">
                        <p className="text-xs font-bold uppercase">{format(new Date(event.date), 'MMM')}</p>
                        <p className="text-lg font-bold">{format(new Date(event.date), 'dd')}</p>
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.occasion} • {event.dress_code || 'No dress code'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
              )}
            </Card>

            <Card className="p-6 bg-primary text-primary-foreground">
              <h3 className="font-bold text-lg mb-2">Need an outfit?</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">
                Let Slay, your AI stylist, curate the perfect look for your next event.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/generate">Generate Outfit</Link>
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
