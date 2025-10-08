export interface Presentation {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrls: string[];
  published: boolean;
  categoryId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  category: {
    id: string;
    name: string;
    bannerImageUrl: string | null;
  };
}

export interface PresentationCategory {
  id: string;
  name: string;
  bannerImageUrl: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  presentations: Presentation[];
  subcategories?: PresentationCategory[];
}

export interface PresentationDetailProps {
  id: string;
  title: string;
  imageUrls: string[];
  description: string;
  content: string;
}

export interface CreatePresentationData {
  title: string;
  description: string;
  content: string;
  imageUrls: string[];
  categoryId: string;
}
