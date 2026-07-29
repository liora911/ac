import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WidgetState, UpdateWidgetInput } from "@/types/Widgets/widgets";

export const widgetsKeys = {
  all: ["widgets"] as const,
  list: (all: boolean) => [...widgetsKeys.all, { all }] as const,
};

// Public: enabled widgets only. Admin (all: true): every stored widget state.
export function useWidgets(options?: { all?: boolean }) {
  const all = options?.all ?? false;
  return useQuery<WidgetState[], Error>({
    queryKey: widgetsKeys.list(all),
    queryFn: async () => {
      const res = await fetch(`/api/widgets${all ? "?all=true" : ""}`);
      if (!res.ok) throw new Error("Failed to fetch widgets");
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useUpdateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      ...input
    }: { key: string } & UpdateWidgetInput): Promise<WidgetState> => {
      const res = await fetch(`/api/widgets/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update widget");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: widgetsKeys.all });
    },
  });
}
