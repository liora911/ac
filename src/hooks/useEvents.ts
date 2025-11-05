import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event } from "../types/Events/events";

// Query keys
export const eventsKeys = {
  all: ["events"] as const,
  lists: () => [...eventsKeys.all, "list"] as const,
  list: (params?: any) => [...eventsKeys.lists(), params] as const,
  details: () => [...eventsKeys.all, "detail"] as const,
  detail: (id: string) => [...eventsKeys.details(), id] as const,
};

// Fetch all events
export function useEvents() {
  return useQuery<Event[], Error>({
    queryKey: eventsKeys.lists(),
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Fetch single event by ID
export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: eventsKeys.detail(id!),
    queryFn: async (): Promise<Event> => {
      if (!id) throw new Error("Event ID is required");

      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Event not found");
        }
        throw new Error(`Failed to fetch event: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Create new event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: any): Promise<Event> => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }

      return response.json();
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
      queryClient.setQueryData(eventsKeys.detail(newEvent.id), newEvent);
    },
  });
}

// Update existing event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updateData
    }: { id: string } & any): Promise<Event> => {
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update event");
      }

      return response.json();
    },
    onSuccess: (updatedEvent) => {
      queryClient.setQueryData(
        eventsKeys.detail(updatedEvent.id),
        updatedEvent
      );
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
    },
  });
}

// Delete event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string): Promise<void> => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete event");
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: eventsKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
    },
  });
}
