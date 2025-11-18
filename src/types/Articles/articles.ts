export interface Article {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  status: ArticleStatus;
  publishedAt?: string;
  isFeatured: boolean;
  viewCount: number;
  readTime: number;
  direction?: "ltr" | "rtl";
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: ArticleAuthor;
  categoryId?: string;
  category?: ArticleCategory;
  tags?: ArticleTag[];
}

export interface ArticleAuthor {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface ArticleCategory {
  id: string;
  name: string;
  bannerImageUrl?: string;
  parentId?: string;
  parent?: ArticleCategory;
  subcategories?: ArticleCategory[];
}

export interface ArticleTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CreateArticleRequest {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: string;
  tags?: string[];
  status?: ArticleStatus;
  isFeatured?: boolean;
  direction?: "ltr" | "rtl";
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  publisherName?: string;
  publisherImage?: string;
}

export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {
  id: string;
}

export interface ArticlesListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ArticlesQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  tagId?: string;
  status?: ArticleStatus;
  search?: string;
  featured?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "title" | "viewCount";
  sortOrder?: "asc" | "desc";
}

export interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  categoryId: string;
  tags: string[];
  status: ArticleStatus;
  isFeatured: boolean;
  direction: "ltr" | "rtl";
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  publisherName: string;
  publisherImage?: string;
}

export interface ArticleStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  averageReadTime: number;
}

export interface ArticleFormProps {
  article?: Article;
  onSuccess?: () => void;
  onCancel?: () => void;
}
