export interface Presentation {
  id: string;
  title: string;
  description: string;
  content: string;
  /**
   * Optional link to external slides (e.g. Google Slides / Google Drive URL)
   */
  googleSlidesUrl?: string;
  /**
   * Optional URL to uploaded PDF presentation file
   */
  pdfUrl?: string;
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
  googleSlidesUrl?: string;
}

export interface CreatePresentationData {
  title: string;
  description: string;
  content: string;
  googleSlidesUrl?: string;
  imageUrls: string[];
  categoryId: string;
}
