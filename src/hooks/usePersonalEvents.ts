import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/constants/query-cache";

export interface PersonalEvent {
  id: string;
  title: string;
  note: string | null;
  date: string; // ISO datetime, day at midnight UTC
  time: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalEventInput {
  title: string;
  note?: string;
  date: string; // "YYYY-MM-DD"
  time?: string | null;
  color?: string | null;
}

export const personalEventsKeys = {
  all: ["personal-events"] as const,
  lists: () => [...personalEventsKeys.all, "list"] as const,
};

export function usePersonalEvents() {
  return useQuery<PersonalEvent[], Error>({
    queryKey: personalEventsKeys.lists(),
    queryFn: async () => {
      const response = await fetch("/api/personal-events");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch personal events: ${response.statusText}`
        );
      }
      return response.json();
    },
    staleTime: queryCache.default.staleTime,
    gcTime: queryCache.default.gcTime,
  });
}

export function useCreatePersonalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PersonalEventInput): Promise<PersonalEvent> => {
      const response = await fetch("/api/personal-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalEventsKeys.all });
    },
  });
}

export function useUpdatePersonalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<PersonalEventInput>): Promise<PersonalEvent> => {
      const response = await fetch(`/api/personal-events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalEventsKeys.all });
    },
  });
}

export function useDeletePersonalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/personal-events/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete entry");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalEventsKeys.all });
    },
  });
}
