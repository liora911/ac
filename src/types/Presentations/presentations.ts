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
  isPremium: boolean;
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

// ============================================
// PRESENTATION COMPONENT PROPS
// ============================================

/**
 * Props for the PresentationsCarouselView component.
 * Displays presentations in horizontal carousels grouped by category.
 */
export interface PresentationsCarouselViewProps {
  categories: PresentationCategory[];
}

/**
 * Props for the CategoryCarousel component (internal).
 * Single category carousel section for presentations.
 */
export interface PresentationCategoryCarouselProps {
  category: PresentationCategory;
  hasAccess: (presentation: Presentation) => boolean;
}

/**
 * Props for the PresentationCard component.
 * Individual presentation card in carousel or grid.
 */
export interface PresentationCardProps {
  presentation: Presentation;
  hasAccess: boolean;
  categoryName?: string;
}

/**
 * Props for the SlidesPlayer component.
 * Full-screen Google Slides player modal.
 */
export interface SlidesPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  embedUrl: string;
  title: string;
  googleSlidesUrl?: string;
}

/**
 * Props for the PresentationPlaceholder component.
 * Generative placeholder for presentations without thumbnail.
 */
export interface PresentationPlaceholderProps {
  id: string;
  className?: string;
}
