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
};

export interface ContentCardProps {
  title: string;
  icon: React.ElementType;
  items: ContentItem[];
  href: string;
  renderItem: (item: ContentItem) => React.ReactNode;
  iconColor: string;
  itemVariants: Variants;
}
