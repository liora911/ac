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
  // RBAC / ownership (only present on manager/owner responses)
  ownerEmail?: string | null; // email allowed to self-edit (managers only)
  isOwner?: boolean; // true if the current viewer is the linked owner
  canEdit?: boolean; // true if the current viewer may edit this profile
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
  ownerEmail?: string | null; // link/unlink an owner login by email
}
