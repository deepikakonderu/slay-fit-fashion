import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SavedOutfit } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./use-toast";

export const useSavedOutfits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["savedOutfits", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("saved_outfits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedOutfit[];
    },
    enabled: !!user,
  });

  const saveOutfit = useMutation({
    mutationFn: async (newOutfit: Omit<SavedOutfit, "id" | "user_id" | "created_at">) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("saved_outfits")
        .insert([{ ...newOutfit, items: newOutfit.items as any, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as SavedOutfit;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["savedOutfits", user?.id], (old: SavedOutfit[] = []) => [data, ...old]);
      toast({ title: "Outfit saved", description: "Successfully saved to your collection." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save outfit", description: error.message, variant: "destructive" });
    },
  });

  const deleteOutfit = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("saved_outfits")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(["savedOutfits", user?.id], (old: SavedOutfit[] = []) =>
        old.filter((outfit) => outfit.id !== id)
      );
      toast({ title: "Outfit deleted", description: "Removed from your collection." });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  return {
    outfits: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    saveOutfit: saveOutfit.mutateAsync,
    deleteOutfit: deleteOutfit.mutateAsync,
    isSaving: saveOutfit.isPending,
    isDeleting: deleteOutfit.isPending,
  };
};
