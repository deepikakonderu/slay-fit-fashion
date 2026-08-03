import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Shirt, Heart, ChevronRight, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

      <Navigation />

      <main className="container max-w-6xl mx-auto px-4 pt-32 pb-16 flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 border border-primary/10 text-primary text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen AI Fashion Stylist
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-none animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Slay Your Look <br /> With Gemini AI
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
            Your personal digital closet. Upload wardrobe items, get AI-generated outfit recommendations, and dress perfectly for any occasion.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Button asChild size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg hover:scale-[1.02] transition-transform">
              <Link to="/auth">
                Get Started Free
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 hover:bg-secondary/10">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
          <Card className="p-8 border-primary/10 bg-secondary/5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <Shirt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Wardrobe Tagging</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Just snap a picture of your clothes. Gemini automatically detects category, color, material, and seasonal suitability.
              </p>
            </div>
          </Card>

          <Card className="p-8 border-primary/10 bg-secondary/5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6 text-secondary-foreground">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Occasion-Based Shuffling</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dressing for a summer wedding, a date, or casual work environment? The AI selects the perfect fit based on weather and style rules.
              </p>
            </div>
          </Card>

          <Card className="p-8 border-primary/10 bg-secondary/5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 text-accent-foreground">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lookbook & Insights</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Save combinations to your calendar, tracking outfit ratings, styling notes, and matching logs for upcoming events.
              </p>
            </div>
          </Card>
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground border-t border-primary/5">
        &copy; {new Date().getFullYear()} SlayFit AI. Elegant, fast, and intelligent styling.
      </footer>
    </div>
  );
};

export default Home;