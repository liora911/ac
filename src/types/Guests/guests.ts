export interface Guest {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string | null;
  headline: string | null;
  bio: string | null; // rich HTML — the guest's whole page body
  photoUrl: string | null;
  bannerImageUrl: string | null;
  galleryUrls: string[];
  websiteUrl: string | null;
  email: string | null; // only returned to admins
  titleDirection: string;
  published: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuestInput {
  name: string;
  nameEn?: string;
  slug?: string;
  headline?: string;
  bio?: string;
  photoUrl?: string;
  bannerImageUrl?: string;
  galleryUrls?: string[];
  websiteUrl?: string;
  email?: string;
  titleDirection?: string;
  published?: boolean;
  isFeatured?: boolean;
}
