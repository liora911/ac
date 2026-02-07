import { Variants } from "framer-motion";

export type ContentItem = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  articleImage?: string | null;
  bannerImageUrl?: string | null;
  videoUrl?: string | null;
  imageUrls?: string[];
  isPremium?: boolean;
  isFeatured?: boolean;
  _contentType?: "article" | "lecture" | "presentation";
};

/**
 * Props for the MixedCarouselSection component.
 * Displays a mix of content types with per-item routing.
 */
export interface MixedCarouselSectionProps {
  title: string;
  items: ContentItem[];
  getImageUrl: (item: ContentItem) => string | null;
  getSubtitle?: (item: ContentItem) => string | null;
}

export interface ContentCardProps {
  title: string;
  icon: React.ElementType;
  items: ContentItem[];
  href: string;
  renderItem: (item: ContentItem) => React.ReactNode;
  iconColor: string;
  itemVariants: Variants;
}

// ============================================
// HOME PAGE COMPONENT PROPS
// ============================================

/**
 * Props for the FeaturedCarouselSection component.
 * Enhanced featured content carousel with hover preview.
 */
export interface FeaturedCarouselSectionProps {
  title: string;
  items: ContentItem[];
  href: string;
  linkPrefix: string;
  useSlug?: boolean;
  contentType: string;
  onLoadMore: (type: string, skip: number) => Promise<{ items: ContentItem[]; hasMore: boolean }>;
  getImageUrl: (item: ContentItem) => string | null;
  getSubtitle?: (item: ContentItem) => string | null;
}

/**
 * Props for the CarouselSection component.
 * Standard content carousel with pagination.
 */
export interface CarouselSectionProps {
  title: string;
  items: ContentItem[];
  href: string;
  linkPrefix: string;
  useSlug?: boolean;
  contentType: string;
  onLoadMore: (type: string, skip: number) => Promise<{ items: ContentItem[]; hasMore: boolean }>;
  getImageUrl: (item: ContentItem) => string | null;
  getSubtitle?: (item: ContentItem) => string | null;
}

/**
 * Props for the ContentPreviewPopover component.
 * Hover preview popup for content items.
 */
export interface ContentPreviewPopoverProps {
  item: ContentItem;
  imageUrl: string | null;
  subtitle: string | null;
  position: { x: number; y: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}
