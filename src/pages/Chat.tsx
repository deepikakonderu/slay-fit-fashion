import React, { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useProfile } from "@/hooks/useProfile";
import { getFashionAdvice, ChatMessage } from "@/services/ai/fashionChat";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const Chat = () => {
  const { user } = useAuth();
  const { items: wardrobe } = useWardrobe();
  const { profile } = useProfile();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Slay, your personal AI fashion stylist. What are we dressing for today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage }
    ];
    
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await getFashionAdvice(newMessages, wardrobe, profile || null);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to reach Slay. Try again.",
        variant: "destructive"
      });
      // Remove the user message if it failed so they can try again? 
      // Actually keeping it is better UX, they can just type again.
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-4 flex flex-col bg-background">
      <Navigation />
      
      <main className="container max-w-4xl mx-auto px-4 pt-24 flex-1 flex flex-col h-[calc(100vh-2rem)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Stylist Chat
          </h1>
          <p className="text-muted-foreground mt-1">Ask Slay for outfit advice based on your wardrobe.</p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 shadow-lg mb-8">
          <ScrollArea className="flex-1 p-4 h-full" ref={scrollRef}>
            <div className="space-y-6 pb-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-muted rounded-tl-sm prose prose-sm dark:prose-invert max-w-none'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Slay is typing...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-background border-t">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="E.g. What should I wear to a summer wedding?"
                className="flex-1 rounded-full px-6"
                disabled={isTyping}
              />
              <Button type="submit" size="icon" className="rounded-full" disabled={!input.trim() || isTyping}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Chat;
