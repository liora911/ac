export interface Lecture {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  duration: string;
  date?: string;
  bannerImageUrl?: string;
  author?: {
    name: string;
    email: string;
    image: string;
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
}

export interface CategoryDef {
  id: string;
  name: string;
  lectures: LectureDef[];
  subcategories?: CategoryDef[];
  bannerImageUrl?: string;
}
