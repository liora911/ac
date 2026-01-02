import { useQuery } from "@tanstack/react-query";
import { SiteSettings } from "@/types/SiteSettings/settings";

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: "Avshalom Elitzur",
  siteDescription: "",
  contactEmail: "",
  contactPhone: "",
  facebookUrl: "",
  youtubeUrl: "",
  defaultLanguage: "he",
};

export const siteSettingsKeys = {
  all: ["siteSettings"] as const,
  detail: () => [...siteSettingsKeys.all, "detail"] as const,
};

export function useSiteSettings() {
  return useQuery<SiteSettings, Error>({
    queryKey: siteSettingsKeys.detail(),
    queryFn: async () => {
      const response = await fetch("/api/site-settings");
      if (!response.ok) {
        throw new Error(`Failed to fetch site settings: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        id: data.id ?? "settings",
        siteTitle: data.siteTitle ?? DEFAULT_SETTINGS.siteTitle,
        siteDescription: data.siteDescription ?? DEFAULT_SETTINGS.siteDescription,
        contactEmail: data.contactEmail ?? DEFAULT_SETTINGS.contactEmail,
        contactPhone: data.contactPhone ?? DEFAULT_SETTINGS.contactPhone,
        facebookUrl: data.facebookUrl ?? DEFAULT_SETTINGS.facebookUrl,
        youtubeUrl: data.youtubeUrl ?? DEFAULT_SETTINGS.youtubeUrl,
        defaultLanguage: data.defaultLanguage ?? DEFAULT_SETTINGS.defaultLanguage,
        updatedAt: data.updatedAt ?? null,
      } as SiteSettings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
