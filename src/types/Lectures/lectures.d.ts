// Component Props
export interface LectureModalProps {
  lecture: Lecture | null;
  onClose: () => void;
}

export interface Lecture {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  duration: string;
  date?: string;
  bannerImageUrl?: string;
  isPremium?: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  author?: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export interface Category {
  id: string;
  name: string;
  lectures: Lecture[];
  subcategories?: Category[];
  bannerImageUrl?: string;
}

export interface CategoryTreeProps {
  categories: Category[];
  onSelectCategory: (category: Category) => void;
  level?: number;
  expandedCategories: Record<string, boolean>;
  toggleCategory: (categoryId: string) => void;
  selectedCategoryId?: string | null;
  setSelectedCategoryIdDirectly: (categoryId: string | null) => void;
}

export interface LectureDef {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  duration: string;
  date?: string;
  bannerImageUrl?: string;
  isPremium?: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface CategoryDef {
  id: string;
  name: string;
  lectures: LectureDef[];
  subcategories?: CategoryDef[];
  bannerImageUrl?: string;
}

// ============================================
// LECTURE COMPONENT PROPS
// ============================================

/**
 * Props for the LecturesCarouselView component.
 * Displays lectures in horizontal carousels grouped by category.
 */
export interface LecturesCarouselViewProps {
  categories: Category[];
}

/**
 * Props for the CategoryCarousel component (internal).
 * Single category carousel section.
 */
export interface CategoryCarouselProps {
  category: Category;
  hasAccess: (lecture: Lecture) => boolean;
  onPlayLecture: (lecture: Lecture) => void;
}

/**
 * Props for the LectureCard component.
 * Individual lecture card in carousel or grid.
 */
export interface LectureCardProps {
  lecture: Lecture;
  hasAccess: boolean;
  onPlay: (lecture: Lecture) => void;
  categoryName?: string;
  inGrid?: boolean;
}

/**
 * Props for the LecturePlaceholder component.
 * Generative placeholder for lectures without thumbnail.
 */
export interface LecturePlaceholderProps {
  id: string;
  className?: string;
}
