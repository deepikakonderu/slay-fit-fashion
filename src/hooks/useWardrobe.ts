import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WardrobeItem } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./use-toast";

export const useWardrobe = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["wardrobeItems", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WardrobeItem[];
    },
    enabled: !!user,
  });

  const addItem = useMutation({
    mutationFn: async (newItem: Omit<WardrobeItem, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wardrobe_items")
        .insert([{ ...newItem, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as WardrobeItem;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wardrobeItems", user?.id], (old: WardrobeItem[] = []) => [data, ...old]);
      toast({ title: "Item added", description: "Successfully added to your wardrobe." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add item", description: error.message, variant: "destructive" });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WardrobeItem> }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wardrobe_items")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as WardrobeItem;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wardrobeItems", user?.id], (old: WardrobeItem[] = []) =>
        old.map((item) => (item.id === data.id ? data : item))
      );
      toast({ title: "Item updated", description: "The item has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl?: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Delete image from storage if it exists
      if (imageUrl) {
        const urlParts = imageUrl.split('/wardrobe-images/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('wardrobe-images').remove([filePath]);
        }
      }

      const { error } = await supabase
        .from("wardrobe_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(["wardrobeItems", user?.id], (old: WardrobeItem[] = []) =>
        old.filter((item) => item.id !== id)
      );
      toast({ title: "Item deleted", description: "Removed from your wardrobe." });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    isAdding: addItem.isPending,
    isUpdating: updateItem.isPending,
    isDeleting: deleteItem.isPending,
  };
};
