export interface SiteSettings {
  id?: string;
  siteTitle: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  facebookUrl: string;
  youtubeUrl: string;
  defaultLanguage: "he" | "en";
  updatedAt?: string;
}
