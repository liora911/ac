import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type HomeContent = {
  id: string;
  heroHtml: string | null;
  imageUrl: string | null;
  photoCredit: string | null;
  bioHtml: string;
  updatedAt: string | null;
};

export type UpdateHomeContentPayload = {
  heroHtml?: string | null;
  imageUrl?: string | null;
  photoCredit?: string | null;
  bioHtml?: string;
};

export const homeContentKeys = {
  all: ["homeContent"] as const,
  detail: () => [...homeContentKeys.all, "detail"] as const,
};

export function useHomeContent() {
  return useQuery<HomeContent, Error>({
    queryKey: homeContentKeys.detail(),
    queryFn: async () => {
      const response = await fetch("/api/home-content");
      if (!response.ok) {
        throw new Error(`Failed to fetch home content: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        id: data.id ?? "home",
        heroHtml: data.heroHtml ?? null,
        imageUrl: data.imageUrl ?? null,
        photoCredit: data.photoCredit ?? null,
        bioHtml: data.bioHtml ?? "",
        updatedAt: data.updatedAt ?? null,
      } as HomeContent;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useUpdateHomeContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UpdateHomeContentPayload
    ): Promise<HomeContent> => {
      const response = await fetch("/api/home-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Failed to update home content");
      }

      const data = await response.json();
      return {
        id: data.id ?? "home",
        heroHtml: data.heroHtml ?? null,
        imageUrl: data.imageUrl ?? null,
        photoCredit: data.photoCredit ?? null,
        bioHtml: data.bioHtml ?? "",
        updatedAt: data.updatedAt ?? null,
      } as HomeContent;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(homeContentKeys.detail(), updated);
    },
  });
}
