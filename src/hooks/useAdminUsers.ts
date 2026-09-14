import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  permissions: string[];
  createdAt: string;
}

export const adminUsersKeys = {
  all: ["admin", "users"] as const,
  list: (q?: string) => [...adminUsersKeys.all, "list", q ?? ""] as const,
};

export function useAdminUsers(q?: string) {
  return useQuery<AdminUser[], Error>({
    queryKey: adminUsersKeys.list(q),
    queryFn: async () => {
      const url = q
        ? `/api/admin/users?q=${encodeURIComponent(q)}`
        : "/api/admin/users";
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch users");
      }
      const data = await res.json();
      return data.users as AdminUser[];
    },
    staleTime: 30_000,
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      role,
      permissions,
    }: {
      id: string;
      role?: "USER" | "ADMIN";
      permissions?: string[];
    }): Promise<AdminUser> => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permissions }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
  });
}
