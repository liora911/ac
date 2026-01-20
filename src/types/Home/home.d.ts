import { Variants } from "framer-motion";

export type ContentItem = {
  id: string;
  slug?: string;
  title: string;
  date?: string | null;
  createdAt?: string;
  eventDate?: string;
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
