import { Link, useLocation } from "react-router-dom";
import { Home, Upload, Sparkles, Heart, User, LogOut, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Upload, label: "Upload", path: "/upload" },
    { icon: Sparkles, label: "Generate", path: "/generate" },
    { icon: MessageSquare, label: "Chat", path: "/chat" },
    { icon: Heart, label: "Saved", path: "/saved" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-primary/5 shadow-sm transition-all duration-300">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
              <span className="text-2xl animate-pulse">👗</span>
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-display font-bold">
                SlayFit
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1.5">
              {user ? (
                <>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary-foreground font-semibold shadow-inner border border-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/10"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  <div className="h-4 w-[1px] bg-primary/10 mx-2" />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={signOut}
                    className="rounded-full hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button className="rounded-full px-6 font-medium shadow-md hover:scale-[1.02] transition-transform">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-background/80 backdrop-blur-xl border border-primary/10 rounded-3xl shadow-lg animate-in slide-in-from-bottom-6 duration-500">
          <div className="flex items-center justify-around py-3 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200",
                    isActive
                      ? "text-primary bg-primary/5 scale-105"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
