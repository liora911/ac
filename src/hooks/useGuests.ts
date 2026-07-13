import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/constants/query-cache";
import type {
  Guest,
  GuestWork,
  CreateGuestInput,
  CreateGuestWorkInput,
} from "@/types/Guests/guests";

export const guestsKeys = {
  all: ["guests"] as const,
  lists: () => [...guestsKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...guestsKeys.lists(), params] as const,
  details: () => [...guestsKeys.all, "detail"] as const,
  detail: (idOrSlug: string) => [...guestsKeys.details(), idOrSlug] as const,
  works: () => [...guestsKeys.all, "work"] as const,
  work: (id: string) => [...guestsKeys.works(), id] as const,
};

export function useGuests(options?: { all?: boolean }) {
  const all = options?.all ?? false;
  return useQuery<Guest[], Error>({
    queryKey: guestsKeys.list({ all }),
    queryFn: async () => {
      const response = await fetch(`/api/guests${all ? "?all=true" : ""}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch guests: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: queryCache.default.staleTime,
    gcTime: queryCache.default.gcTime,
  });
}

export function useGuest(idOrSlug: string | undefined) {
  return useQuery<Guest, Error>({
    queryKey: guestsKeys.detail(idOrSlug!),
    queryFn: async () => {
      if (!idOrSlug) throw new Error("Guest ID is required");
      const response = await fetch(`/api/guests/${encodeURIComponent(idOrSlug)}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Guest not found");
        throw new Error(`Failed to fetch guest: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!idOrSlug,
    staleTime: queryCache.default.staleTime,
    gcTime: queryCache.default.gcTime,
  });
}

export function useGuestWork(id: string | undefined) {
  return useQuery<GuestWork, Error>({
    queryKey: guestsKeys.work(id!),
    queryFn: async () => {
      if (!id) throw new Error("Work ID is required");
      const response = await fetch(`/api/guest-works/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Work not found");
        throw new Error(`Failed to fetch work: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: queryCache.default.staleTime,
    gcTime: queryCache.default.gcTime,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGuestInput): Promise<Guest> => {
      const response = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create guest");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKeys.all });
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<CreateGuestInput> & {
        order?: number;
      }): Promise<Guest> => {
      const response = await fetch(`/api/guests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update guest");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKeys.all });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete guest");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKeys.all });
    },
  });
}

export function useCreateGuestWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      guestId,
      ...input
    }: { guestId: string } & CreateGuestWorkInput): Promise<GuestWork> => {
      const response = await fetch(`/api/guests/${guestId}/works`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create work");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKeys.all });
    },
  });
}

export function useUpdateGuestWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<CreateGuestWorkInput> & {
        order?: number;
      }): Promise<GuestWork> => {
      const response = await fetch(`/api/guest-works/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update work");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKeys.all });
    },
  });
}

export function useDeleteGuestWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/guest-works/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete work");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKeys.all });
    },
  });
}
