import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/constants/query-cache";

export const newsletterKeys = {
  all: ["newsletter"] as const,
  subscribers: () => [...newsletterKeys.all, "subscribers"] as const,
};

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

interface SubscribersResponse {
  subscribers: Subscriber[];
  total: number;
}

// Admin: List subscribers
export function useNewsletterSubscribers() {
  return useQuery<SubscribersResponse>({
    queryKey: newsletterKeys.subscribers(),
    queryFn: async () => {
      const response = await fetch("/api/newsletter/subscribers");
      if (!response.ok) throw new Error("Failed to fetch subscribers");
      return response.json();
    },
    staleTime: queryCache.newsletter.staleTime,
    gcTime: queryCache.newsletter.gcTime,
  });
}

// Admin: Remove subscriber
export function useRemoveSubscriber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/newsletter/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove subscriber");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsletterKeys.all });
    },
  });
}

// Admin: Send newsletter
export function useSendNewsletter() {
  return useMutation({
    mutationFn: async (data: {
      articleId: string;
      subject: string;
      customMessage: string;
    }) => {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send newsletter");
      }
      return response.json() as Promise<{
        success: boolean;
        sent: number;
        failed: number;
        total: number;
      }>;
    },
  });
}

// Public: Subscribe to newsletter
export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to subscribe");
      }
      return response.json();
    },
  });
}
