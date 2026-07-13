export interface GuestWork {
  id: string;
  guestId: string;
  title: string;
  titleDirection: string;
  description: string | null;
  content: string | null;
  imageUrls: string[];
  pdfUrl: string | null;
  videoUrl: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  guest?: GuestSummary;
}

export interface GuestSummary {
  id: string;
  name: string;
  slug: string | null;
  headline: string | null;
  photoUrl: string | null;
  titleDirection: string;
}

export interface Guest {
  id: string;
  name: string;
  slug: string | null;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  bannerImageUrl: string | null;
  websiteUrl: string | null;
  email: string | null; // only returned to admins
  titleDirection: string;
  published: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  works?: GuestWork[];
  _count?: { works: number };
}

export interface CreateGuestInput {
  name: string;
  headline?: string;
  bio?: string;
  photoUrl?: string;
  bannerImageUrl?: string;
  websiteUrl?: string;
  email?: string;
  titleDirection?: string;
  published?: boolean;
  isFeatured?: boolean;
}

export interface CreateGuestWorkInput {
  title: string;
  titleDirection?: string;
  description?: string;
  content?: string;
  imageUrls?: string[];
  pdfUrl?: string;
  videoUrl?: string;
  coverImageUrl?: string;
  categoryId?: string | null;
  published?: boolean;
}
