import type { Prisma } from "@prisma/client";

// ============================================
// API TYPES
// ============================================

/**
 * Article with all relations included (for API routes).
 * Used when fetching articles from the database with full relations.
 */
export type ArticleWithRelations = Prisma.ArticleGetPayload<{
  select: {
    id: true;
    title: true;
    subtitle: true;
    slug: true;
    content: true;
    articleImage: true;
    publisherName: true;
    publisherImage: true;
    readDuration: true;
    published: true;
    isPremium: true;
    isFeatured: true;
    order: true;
    createdAt: true;
    updatedAt: true;
    direction: true;
    authorId: true;
    categoryId: true;
    author: { select: { id: true; name: true; email: true; image: true } };
    category: { select: { id: true; name: true; bannerImageUrl: true } };
    categories: { include: { category: { select: { id: true; name: true; bannerImageUrl: true } } } };
    tags: { include: { tag: { select: { id: true; name: true; slug: true; color: true } } } };
    authors: { select: { id: true; name: true; imageUrl: true; order: true } };
  };
}>;

// ============================================
// COMPONENT PROPS
// ============================================

export interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
}

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  status: ArticleStatus;
  publishedAt?: string;
  isFeatured: boolean;
  isPremium: boolean;
  viewCount: number;
  readTime: number;
  direction?: "ltr" | "rtl";
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: ArticleUserAuthor;
  categoryId?: string;
  category?: ArticleCategory;
  categories?: ArticleCategory[]; // Multiple categories support
  tags?: ArticleTag[];
  publisherName?: string;
  publisherImage?: string;
  authors?: ArticleAuthor[]; // Multiple authors support
}

// User who created the article (system author)
export interface ArticleUserAuthor {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

// Display authors for the article (multiple authors feature)
export interface ArticleAuthor {
  id: string;
  name: string;
  imageUrl?: string | null; // Custom image or null for default icon
  order: number;
}

// For creating/updating authors in forms
export interface ArticleAuthorInput {
  id?: string; // Optional - only present when editing existing
  name: string;
  imageUrl?: string | null;
  order: number;
}

export interface ArticleCategory {
  id: string;
  name: string;
  description?: string;
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
  subtitle?: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  categoryId?: string;
  categoryIds?: string[]; // Multiple categories support
  tags?: string[];
  status?: ArticleStatus;
  isFeatured?: boolean;
  isPremium?: boolean;
  direction?: "ltr" | "rtl";
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  publisherName?: string;
  publisherImage?: string;
  authors?: ArticleAuthorInput[]; // Multiple authors
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
  subtitle: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  categoryId: string;
  categoryIds: string[]; // Multiple categories support
  tags: string[];
  status: ArticleStatus;
  isFeatured: boolean;
  isPremium: boolean;
  direction: "ltr" | "rtl";
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  publisherName: string;
  publisherImage?: string;
  authors: ArticleAuthorInput[]; // Multiple authors - required at least 1
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

// ============================================
// ARTICLE COMPONENT PROPS
// ============================================

/**
 * Props for the AuthorAvatars component.
 * Displays multiple author avatars with optional modal.
 */
export interface AuthorAvatarsProps {
  authors: ArticleAuthor[];
  size?: "sm" | "md" | "lg";
  showNames?: boolean;
  maxDisplay?: number;
  clickable?: boolean;
}

/**
 * Props for the AuthorInput component.
 * Form component for managing article authors.
 */
export interface AuthorInputProps {
  authors: ArticleAuthorInput[];
  onChange: (authors: ArticleAuthorInput[]) => void;
  error?: string;
}

/**
 * Props for the SemanticSearch/ArticleSearch component.
 * Search bar for filtering articles.
 */
export interface ArticleSearchProps {
  onSearch: (query: string) => void;
  onClear: () => void;
}

/**
 * Props for the MobileArticleCard component.
 * Compact mobile-optimized article card.
 */
export interface MobileArticleCardProps {
  article: Article;
}

/**
 * Status filter options for ArticlesList.
 */
export type StatusFilter = "" | "PUBLISHED" | "DRAFT" | "ARCHIVED";

/**
 * Sort options for ArticlesList.
 */
export type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

/**
 * Props for the ArticlesList component.
 * Main articles list with filters and pagination.
 */
export interface ArticlesListProps {
  initialLimit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  categoryId?: string;
  featuredOnly?: boolean;
  viewMode?: "grid" | "list";
}

/**
 * Props for the ArticleCard component (desktop grid card).
 */
export interface ArticleCardProps {
  article: Article;
  isAuthorized: boolean;
  onDeleteSuccess: () => void;
}

/**
 * Props for the ShareButton component.
 * Share button for copying article URL to clipboard.
 */
export interface ShareButtonProps {
  shareText: string;
  copiedText: string;
}

/**
 * Props for the DownloadPDFButton component.
 * Downloads article as PDF document.
 */
export interface DownloadPDFButtonProps {
  articleId: string;
  articleTitle: string;
  locale: string;
  dateLocale: string;
  createdAt: string;
  publisherName?: string;
  downloadText: string;
}

/**
 * Props for the ArticleClient component.
 * Client-side article page functionality (tracking, actions).
 */
export interface ArticleClientProps {
  articleId: string;
  articleTitle: string;
  isPremium: boolean;
  categoryName?: string;
  isAuthorized: boolean;
  locale: string;
  dateLocale: string;
  createdAt: string;
  publisherName?: string;
  translations: {
    editButton: string;
    downloadPDF: string;
  };
}

/**
 * Props for the Article page component.
 * Next.js page props with dynamic route parameter.
 */
export interface ArticlePageProps {
  params: Promise<{ id: string }>;
}
