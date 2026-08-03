import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "./use-toast";

export const useEvents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["events", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user,
  });

  const addEvent = useMutation({
    mutationFn: async (newEvent: Omit<Event, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .insert([{ ...newEvent, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Event;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["events", user?.id], (old: Event[] = []) => [...old, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      toast({ title: "Event added", description: "Successfully added to your calendar." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add event", description: error.message, variant: "destructive" });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData(["events", user?.id], (old: Event[] = []) =>
        old.filter((e) => e.id !== id)
      );
      toast({ title: "Event deleted", description: "Removed from your calendar." });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });

  return {
    events: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addEvent: addEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
    isAdding: addEvent.isPending,
    isDeleting: deleteEvent.isPending,
  };
};
